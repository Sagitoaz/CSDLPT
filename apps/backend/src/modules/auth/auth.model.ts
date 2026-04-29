import { Schema, model } from 'mongoose';

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  BRANCH_ADMIN = 'BRANCH_ADMIN',
  STAFF = 'STAFF',
  DONOR = 'DONOR',
}

export interface IUser {
  _id?: string;
  email: string;
  phone?: string;
  password: string; // hashed
  fullName: string;
  role: UserRole;
  branchId?: string;
  permissions?: string[];
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
    },
    fullName: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.DONOR,
    },
    phone: {
      type: String,
      trim: true,
      sparse: true
    },
    branchId: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      index: true,
      sparse: true
    },
    permissions: {
      type: [String],
      default: []
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for email-based queries
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ branchId: 1, role: 1 });
userSchema.index({ phone: 1 }, { unique: true, sparse: true });

export const User = model<IUser>('User', userSchema);
