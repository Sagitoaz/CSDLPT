/**
 * Transaction Examples
 * SECURITY-08: Multi-document ACID transactions with MongoDB
 *
 * Demonstrates how to use transactions for complex operations
 * that span multiple documents/collections.
 *
 * Note: Transactions require MongoDB 4.0+ with replica set
 */

import mongoose, { ClientSession } from 'mongoose';

/**
 * Example 1: Approve Donation + Update Campaign Stats (Single Transaction)
 *
 * ACID Guarantee: Both operations succeed or both rollback
 * - If approve fails: Campaign is NOT updated
 * - If campaign update fails: Donation approval is rolled back
 */
export async function approveDonationWithTransaction(
  donationId: string,
  staffId: string
): Promise<boolean> {
  const session: ClientSession = await mongoose.startSession();
  session.startTransaction();

  try {
    // Step 1: Update donation status to "approved"
    const Donation = mongoose.model('Donation');
    const donation = await Donation.findByIdAndUpdate(
      donationId,
      {
        status: 'approved',
        approvedAt: new Date(),
        approvedBy: staffId,
      },
      { session, new: true }
    );

    if (!donation) {
      throw new Error('Donation not found');
    }

    // Step 2: Update campaign currentAmount
    const Campaign = mongoose.model('Campaign');
    const campaign = await Campaign.findOneAndUpdate(
      { campaignCode: donation.campaignCode },
      { $inc: { currentAmount: donation.amount } },
      { session, new: true }
    );

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    // Step 3: Update campaign status if goal reached
    if (campaign.currentAmount >= campaign.goalAmount) {
      await Campaign.findByIdAndUpdate(
        campaign._id,
        { status: 'completed' },
        { session }
      );
    }

    // Commit transaction
    await session.commitTransaction();
    console.log('Transaction committed successfully');
    return true;
  } catch (error) {
    // Rollback on error
    await session.abortTransaction();
    console.error('Transaction aborted:', error);
    throw error;
  } finally {
    await session.endSession();
  }
}

/**
 * Example 2: Reject Donation (Simple Transaction)
 *
 * When rejecting, we need to:
 * - Mark donation as rejected
 * - Possibly notify donor
 * - Log audit entry
 */
export async function rejectDonationWithTransaction(
  donationId: string,
  staffId: string,
  reason: string
): Promise<boolean> {
  const session: ClientSession = await mongoose.startSession();
  session.startTransaction();

  try {
    const Donation = mongoose.model('Donation');

    // Update donation
    const donation = await Donation.findByIdAndUpdate(
      donationId,
      {
        status: 'rejected',
        notes: reason,
        approvedBy: staffId,
        approvedAt: new Date(),
      },
      { session, new: true }
    );

    if (!donation) {
      throw new Error('Donation not found');
    }

    // Optional: Create audit log entry in separate collection
    // (requires AuditLog model to be defined)
    // const AuditLog = mongoose.model('AuditLog');
    // await AuditLog.create(
    //   [{ donationId, action: 'reject', reason, staffId }],
    //   { session }
    // );

    await session.commitTransaction();
    return true;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
}

/**
 * Example 3: Create Campaign + Initialize Stats (Complex Transaction)
 *
 * When creating a new campaign:
 * - Insert campaign document
 * - Initialize stat document
 * - Update user's campaign count
 * - Ensure all succeed or all fail
 */
export async function createCampaignWithStats(
  campaignData: {
    campaignCode: string;
    title: string;
    goalAmount: number;
    createdBy: string;
  }
): Promise<any> {
  const session: ClientSession = await mongoose.startSession();
  session.startTransaction();

  try {
    const Campaign = mongoose.model('Campaign');
    const Stat = mongoose.model('Stat');

    // Step 1: Create campaign
    const campaign = await Campaign.create(
      [
        {
          ...campaignData,
          currentAmount: 0,
          status: 'active',
          createdAt: new Date(),
        },
      ],
      { session }
    );

    if (!campaign || !campaign[0]) {
      throw new Error('Failed to create campaign');
    }

    const createdCampaign = campaign[0];

    // Step 2: Create initial stat record
    await Stat.create(
      [
        {
          type: 'campaign',
          campaignCode: campaignData.campaignCode,
          totalDonations: 0,
          totalAmount: 0,
          donorCount: 0,
          status: 'active',
          calculatedAt: new Date(),
        },
      ],
      { session }
    );

    // Step 3: (Optional) Update user's campaign count
    // const User = mongoose.model('User');
    // await User.findByIdAndUpdate(
    //   campaignData.createdBy,
    //   { $inc: { campaignCount: 1 } },
    //   { session }
    // );

    await session.commitTransaction();
    return createdCampaign;
  } catch (error) {
    await session.abortTransaction();
    console.error('Campaign creation transaction failed:', error);
    throw error;
  } finally {
    await session.endSession();
  }
}

/**
 * Example 4: Transfer Donation Between Campaigns (Advanced)
 *
 * Use case: Admin needs to move a donation from campaign A to campaign B
 * This requires:
 * - Decrement campaign A total
 * - Increment campaign B total
 * - Update donation reference
 * - All or nothing
 */
export async function transferDonationBetweenCampaigns(
  donationId: string,
  fromCampaignCode: string,
  toCampaignCode: string,
  staffId: string
): Promise<boolean> {
  const session: ClientSession = await mongoose.startSession();
  session.startTransaction();

  try {
    const Donation = mongoose.model('Donation');
    const Campaign = mongoose.model('Campaign');

    // Get donation
    const donation = await Donation.findById(donationId, {}, { session });
    if (!donation) {
      throw new Error('Donation not found');
    }

    if (donation.campaignCode !== fromCampaignCode) {
      throw new Error('Donation not in source campaign');
    }

    // Update donation campaign
    await Donation.findByIdAndUpdate(
      donationId,
      { campaignCode: toCampaignCode },
      { session }
    );

    // Decrement source campaign
    await Campaign.findOneAndUpdate(
      { campaignCode: fromCampaignCode },
      { $inc: { currentAmount: -donation.amount } },
      { session }
    );

    // Increment target campaign
    await Campaign.findOneAndUpdate(
      { campaignCode: toCampaignCode },
      { $inc: { currentAmount: donation.amount } },
      { session }
    );

    await session.commitTransaction();
    return true;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
}

/**
 * Best Practices for Transactions:
 *
 * 1. Keep transactions short
 *    - Minimize lock time
 *    - Process complex logic outside transaction
 *
 * 2. Single shard is best
 *    - Avoid multi-shard transactions (slow, complex)
 *    - Design sharding key to keep related data together
 *
 * 3. Retry logic
 *    - Network can fail, implement retry with exponential backoff
 *    - MongoDB retry mechanism available
 *
 * 4. Error handling
 *    - Always abort transaction on error
 *    - Log transaction failures for audit
 *    - Notify users of failures appropriately
 *
 * 5. Idempotency
 *    - Make transactions idempotent (safe to retry)
 *    - Use idempotency keys if needed
 *
 * 6. Monitoring
 *    - Track transaction latency
 *    - Alert on transaction failures
 *    - Monitor rollbacks
 */

/**
 * Usage in route handler:
 *
 * router.patch('/donations/:id/approve', requireAuth, async (req, res) => {
 *   try {
 *     const result = await approveDonationWithTransaction(
 *       req.params.id,
 *       req.user.userId
 *     );
 *     res.json({ success: true, data: result });
 *   } catch (error) {
 *     res.status(500).json({
 *       success: false,
 *       message: 'Failed to approve donation',
 *       error: error.message
 *     });
 *   }
 * });
 */
