# Tom tat schema MongoDB theo tai lieu

File nay tom tat cac collection, field, enum va mang trong database cua du an theo cac tai lieu `.md` va `.tex`, dac biet la:

- `Baocao.tex`
- `huong-dan/Thiet ke csdl/16-thiet-ke-csdl-mongodb.md`

Luu y: day la schema theo tai lieu thiet ke. Mot so API/collection cu nhu `donors`, `donations`, `disbursements` duoc giu de tuong thich, nhung theo mo hinh moi se anh xa nhu sau:

- `donors` mo rong thanh `contributors`
- `donations` anh xa sang `contributions` voi `type = MONEY`
- `disbursements` anh xa sang `aid_distributions` voi `type = MONEY`

## 1. Danh sach collection chinh

Theo tai lieu, database co 10 collection chinh:

| Collection | Nhom nghiep vu | Y nghia |
|---|---|---|
| `branches` | Chi nhanh / phan quyen | Luu tru so, chi nhanh, trung tam vung |
| `users` | Tai khoan / RBAC | Luu nguoi dung, role, branchId va permissions |
| `campaigns` | Chien dich | Luu chien dich tu thien, muc tieu, nguon luc can, thong ke nhanh |
| `contributors` | Nguon luc dau vao | Luu ca nhan/to chuc dong gop |
| `contributions` | Giao dich dau vao | Luu tien, hien vat, dich vu, gio cong dong gop |
| `beneficiaries` | Nguoi nhan ho tro | Luu nguoi/ho/to chuc/cong dong nhan ho tro |
| `aid_distributions` | Phan phoi dau ra | Luu cac dot trao tien, hang hoa, dich vu ho tro |
| `volunteers` | Tinh nguyen vien | Luu ho so, ky nang, lich ranh va chien dich tham gia |
| `activity_logs` | Audit | Luu nhat ky thao tac, actor, entity, before/after |
| `stats_snapshots` | Thong ke | Luu snapshot thong ke de dashboard doc nhanh |

## 2. `branches`

Dung de luu thong tin tru so, chi nhanh va trung tam vung.

```ts
{
  _id: ObjectId,
  code: string,              // unique
  name: string,
  type: "HEADQUARTER" | "BRANCH" | "REGIONAL_CENTER",
  parentId: ObjectId | null,
  location: {
    province: string,
    district: string,
    ward: string,
    address: string
  },
  contact: {
    phone: string,
    email: string
  },
  status: "ACTIVE" | "INACTIVE" | "LOCKED",
  createdAt: Date,
  updatedAt: Date
}
```

### Enum

- `type`: `HEADQUARTER`, `BRANCH`, `REGIONAL_CENTER`
- `status`: `ACTIVE`, `INACTIVE`, `LOCKED`

### Object con

- `location`
- `contact`

## 3. `users`

Dung de luu tai khoan dang nhap, role va pham vi chi nhanh.

```ts
{
  _id: ObjectId,
  fullName: string,
  email: string,             // unique
  phone: string,
  passwordHash: string,
  role: "SUPER_ADMIN" | "BRANCH_ADMIN" | "STAFF" | "CONTRIBUTOR" | "VOLUNTEER",
  branchId: ObjectId | null,
  permissions: string[],
  status: "ACTIVE" | "LOCKED" | "DISABLED",
  profile: {
    avatarUrl: string,
    title: string
  },
  lastLoginAt: Date | null,
  createdAt: Date,
  updatedAt: Date
}
```

### Enum

- `role`: `SUPER_ADMIN`, `BRANCH_ADMIN`, `STAFF`, `CONTRIBUTOR`, `VOLUNTEER`
- `status`: `ACTIVE`, `LOCKED`, `DISABLED`

### Mang

- `permissions: string[]`

### Object con

- `profile`

## 4. `campaigns`

Dung de luu chien dich tu thien. Day la aggregate root trung tam cua he thong.

```ts
{
  _id: ObjectId,
  branchId: ObjectId,
  code: string,              // unique
  title: string,
  description: string,
  type: "FLOOD_RELIEF" | "MEDICAL" | "EDUCATION" | "FOOD_SUPPORT" | "OTHER",
  status: "DRAFT" | "ACTIVE" | "PAUSED" | "COMPLETED" | "CANCELLED",
  visibility: "PUBLIC" | "PRIVATE",
  location: {
    province: string,
    district: string,
    ward: string,
    address: string
  },
  timeRange: {
    startDate: Date,
    endDate: Date | null
  },
  goals: {
    targetMoneyAmount: number,
    targetItemSummary: [
      {
        name: string,
        quantity: number,
        unit: string
      }
    ],
    targetVolunteerCount: number
  },
  requiredResources: [
    {
      resourceType: "MONEY" | "FOOD" | "MEDICINE" | "CLOTHES" | "BOOK" | "SERVICE" | "VOLUNTEER_WORK" | "OTHER",
      name: string,
      quantity: number,
      unit: string,
      estimatedValue: number,
      note: string
    }
  ],
  summaryStats: {
    totalMoneyReceived: number,
    totalEstimatedItemValue: number,
    totalItemsReceived: number,
    totalVolunteerHours: number,
    totalMoneyDistributed: number,
    totalEstimatedAidValue: number,
    beneficiaryCount: number
  },
  images: [
    {
      url: string,
      caption: string
    }
  ],
  documents: [
    {
      url: string,
      name: string,
      type: string
    }
  ],
  createdBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

### Enum

- `type`: `FLOOD_RELIEF`, `MEDICAL`, `EDUCATION`, `FOOD_SUPPORT`, `OTHER`
- `status`: `DRAFT`, `ACTIVE`, `PAUSED`, `COMPLETED`, `CANCELLED`
- `visibility`: `PUBLIC`, `PRIVATE`
- `requiredResources[].resourceType`: `MONEY`, `FOOD`, `MEDICINE`, `CLOTHES`, `BOOK`, `SERVICE`, `VOLUNTEER_WORK`, `OTHER`

### Mang

- `goals.targetItemSummary[]`
- `requiredResources[]`
- `images[]`
- `documents[]`

### Object con

- `location`
- `timeRange`
- `goals`
- `summaryStats`

## 5. `contributors`

Dung de luu nguoi dong gop, co the la ca nhan hoac to chuc.

```ts
{
  _id: ObjectId,
  type: "INDIVIDUAL" | "ORGANIZATION",
  fullName: string | null,
  organizationName: string | null,
  phone: string,
  email: string,
  address: {
    province: string,
    district: string,
    detail: string
  },
  identityInfo: {
    type: "OPTIONAL_MASKED",
    last4: string
  },
  totalContributionStats: {
    totalMoney: number,
    totalEstimatedItemValue: number,
    totalVolunteerHours: number,
    contributionCount: number
  },
  userId: ObjectId | null,
  createdAt: Date,
  updatedAt: Date
}
```

### Enum

- `type`: `INDIVIDUAL`, `ORGANIZATION`
- `identityInfo.type`: `OPTIONAL_MASKED`

### Object con

- `address`
- `identityInfo`
- `totalContributionStats`

## 6. `contributions`

Dung de luu nguon luc dau vao: tien, hang hoa, dich vu, gio cong.

```ts
{
  _id: ObjectId,
  branchId: ObjectId,
  campaignId: ObjectId,
  contributorId: ObjectId,
  type: "MONEY" | "ITEM" | "MEDICINE" | "CLOTHES" | "BOOK" | "SERVICE" | "VOLUNTEER_WORK" | "OTHER",
  status: "PENDING" | "CONFIRMED" | "RECEIVED" | "CANCELLED" | "REJECTED" | "REFUNDED",
  contributorSnapshot: {
    fullName: string | null,
    organizationName: string | null,
    phone: string,
    email: string,
    type: "INDIVIDUAL" | "ORGANIZATION"
  },
  campaignSnapshot: {
    code: string,
    title: string
  },
  branchSnapshot: {
    code: string,
    name: string
  },
  moneyDetail: {
    amount: number,
    currency: "VND",
    paymentMethod: "CASH" | "BANK_TRANSFER" | "ONLINE_GATEWAY" | "OTHER",
    paymentStatus: "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED",
    transactionCode: string,
    paidAt: Date | null
  },
  itemDetails: [
    {
      name: string,
      category: "FOOD" | "MEDICINE" | "CLOTHES" | "BOOK" | "OTHER",
      quantity: number,
      unit: string,
      condition: "NEW" | "USED" | "EXPIRED_CHECKED" | "OTHER",
      estimatedValue: number,
      note: string
    }
  ],
  serviceDetail: {
    serviceName: string,
    provider: string,
    estimatedHours: number,
    estimatedValue: number,
    note: string
  },
  volunteerWorkDetail: {
    skill: string,
    hours: number,
    workDate: Date,
    description: string
  },
  proofs: [
    {
      type: "IMAGE" | "PDF" | "RECEIPT" | "OTHER",
      url: string,
      description: string,
      uploadedAt: Date,
      uploadedBy: ObjectId
    }
  ],
  receivedAt: Date | null,
  createdBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

### Enum

- `type`: `MONEY`, `ITEM`, `MEDICINE`, `CLOTHES`, `BOOK`, `SERVICE`, `VOLUNTEER_WORK`, `OTHER`
- `status`: `PENDING`, `CONFIRMED`, `RECEIVED`, `CANCELLED`, `REJECTED`, `REFUNDED`
- `contributorSnapshot.type`: `INDIVIDUAL`, `ORGANIZATION`
- `moneyDetail.currency`: `VND`
- `moneyDetail.paymentMethod`: `CASH`, `BANK_TRANSFER`, `ONLINE_GATEWAY`, `OTHER`
- `moneyDetail.paymentStatus`: `PENDING`, `SUCCESS`, `FAILED`, `REFUNDED`
- `itemDetails[].category`: `FOOD`, `MEDICINE`, `CLOTHES`, `BOOK`, `OTHER`
- `itemDetails[].condition`: `NEW`, `USED`, `EXPIRED_CHECKED`, `OTHER`
- `proofs[].type`: `IMAGE`, `PDF`, `RECEIPT`, `OTHER`

### Mang

- `itemDetails[]`
- `proofs[]`

### Object con

- `contributorSnapshot`
- `campaignSnapshot`
- `branchSnapshot`
- `moneyDetail`
- `serviceDetail`
- `volunteerWorkDetail`

## 7. `beneficiaries`

Dung de luu nguoi, ho gia dinh, to chuc hoac cong dong nhan ho tro.

```ts
{
  _id: ObjectId,
  branchId: ObjectId,
  campaignId: ObjectId,
  type: "PERSON" | "FAMILY" | "ORGANIZATION" | "COMMUNITY",
  name: string,
  phone: string,
  address: {
    province: string,
    district: string,
    ward: string,
    detail: string
  },
  situationDescription: string,
  needs: [
    {
      resourceType: "MONEY" | "FOOD" | "MEDICINE" | "CLOTHES" | "BOOK" | "SERVICE" | "OTHER",
      name: string,
      quantity: number,
      unit: string,
      estimatedValue: number,
      note: string
    }
  ],
  verification: {
    status: "PENDING" | "VERIFIED" | "REJECTED",
    verifiedBy: ObjectId | null,
    verifiedAt: Date | null,
    note: string
  },
  documents: [
    {
      type: "IMAGE" | "PDF" | "OTHER",
      url: string,
      description: string
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

### Enum

- `type`: `PERSON`, `FAMILY`, `ORGANIZATION`, `COMMUNITY`
- `needs[].resourceType`: `MONEY`, `FOOD`, `MEDICINE`, `CLOTHES`, `BOOK`, `SERVICE`, `OTHER`
- `verification.status`: `PENDING`, `VERIFIED`, `REJECTED`
- `documents[].type`: `IMAGE`, `PDF`, `OTHER`

### Mang

- `needs[]`
- `documents[]`

### Object con

- `address`
- `verification`

## 8. `aid_distributions`

Dung de luu nguon luc dau ra: phat tien, trao hang, ho tro dich vu hoac hon hop.

```ts
{
  _id: ObjectId,
  branchId: ObjectId,
  campaignId: ObjectId,
  beneficiaryId: ObjectId,
  type: "MONEY" | "ITEM" | "MEDICINE" | "CLOTHES" | "BOOK" | "SERVICE" | "MIXED" | "OTHER",
  status: "PLANNED" | "APPROVED" | "DELIVERED" | "COMPLETED" | "CANCELLED" | "REJECTED",
  beneficiarySnapshot: {
    name: string,
    type: "PERSON" | "FAMILY" | "ORGANIZATION" | "COMMUNITY",
    phone: string,
    addressSummary: string
  },
  campaignSnapshot: {
    code: string,
    title: string
  },
  branchSnapshot: {
    code: string,
    name: string
  },
  moneySupport: {
    amount: number,
    currency: "VND",
    method: "CASH" | "BANK_TRANSFER" | "OTHER"
  },
  itemSupports: [
    {
      name: string,
      category: "FOOD" | "MEDICINE" | "CLOTHES" | "BOOK" | "OTHER",
      quantity: number,
      unit: string,
      estimatedValue: number,
      note: string
    }
  ],
  serviceSupport: {
    serviceName: string,
    provider: string,
    estimatedHours: number,
    estimatedValue: number,
    note: string
  },
  proofs: [
    {
      type: "IMAGE" | "PDF" | "CONFIRMATION" | "OTHER",
      url: string,
      description: string,
      uploadedAt: Date,
      uploadedBy: ObjectId
    }
  ],
  approvedBy: ObjectId | null,
  approvedAt: Date | null,
  deliveredAt: Date | null,
  completedAt: Date | null,
  createdBy: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

### Enum

- `type`: `MONEY`, `ITEM`, `MEDICINE`, `CLOTHES`, `BOOK`, `SERVICE`, `MIXED`, `OTHER`
- `status`: `PLANNED`, `APPROVED`, `DELIVERED`, `COMPLETED`, `CANCELLED`, `REJECTED`
- `beneficiarySnapshot.type`: `PERSON`, `FAMILY`, `ORGANIZATION`, `COMMUNITY`
- `moneySupport.currency`: `VND`
- `moneySupport.method`: `CASH`, `BANK_TRANSFER`, `OTHER`
- `itemSupports[].category`: `FOOD`, `MEDICINE`, `CLOTHES`, `BOOK`, `OTHER`
- `proofs[].type`: `IMAGE`, `PDF`, `CONFIRMATION`, `OTHER`

### Mang

- `itemSupports[]`
- `proofs[]`

### Object con

- `beneficiarySnapshot`
- `campaignSnapshot`
- `branchSnapshot`
- `moneySupport`
- `serviceSupport`

## 9. `volunteers`

Dung de luu tinh nguyen vien, ky nang, lich ranh va chien dich duoc gan.

```ts
{
  _id: ObjectId,
  branchId: ObjectId,
  userId: ObjectId | null,
  fullName: string,
  phone: string,
  email: string,
  skills: string[],
  availability: [
    {
      dayOfWeek: "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY",
      timeRange: string
    }
  ],
  assignedCampaignIds: ObjectId[],
  stats: {
    totalHours: number,
    completedActivities: number
  },
  status: "ACTIVE" | "INACTIVE" | "LOCKED",
  createdAt: Date,
  updatedAt: Date
}
```

### Enum

- `availability[].dayOfWeek`: `MONDAY`, `TUESDAY`, `WEDNESDAY`, `THURSDAY`, `FRIDAY`, `SATURDAY`, `SUNDAY`
- `status`: `ACTIVE`, `INACTIVE`, `LOCKED`

### Mang

- `skills: string[]`
- `availability[]`
- `assignedCampaignIds: ObjectId[]`

### Object con

- `stats`

## 10. `activity_logs`

Dung de audit: ai thao tac, thao tac gi, tren entity nao, truoc/sau thay doi ra sao.

```ts
{
  _id: ObjectId,
  branchId: ObjectId | null,
  actor: {
    actorId: ObjectId,
    role: string,
    branchId: ObjectId | null,
    fullName: string
  },
  action: string,
  entity: {
    entityType: "branch" | "user" | "campaign" | "contributor" | "contribution" | "beneficiary" | "aid_distribution" | "volunteer",
    entityId: ObjectId
  },
  description: string,
  metadata: {
    requestId: string,
    source: "admin-api" | "public-api" | "system-job"
  },
  before: object,
  after: object,
  ipAddress: string,
  userAgent: string,
  createdAt: Date
}
```

### Enum

- `entity.entityType`: `branch`, `user`, `campaign`, `contributor`, `contribution`, `beneficiary`, `aid_distribution`, `volunteer`
- `metadata.source`: `admin-api`, `public-api`, `system-job`

### Object con

- `actor`
- `entity`
- `metadata`
- `before`
- `after`

## 11. `stats_snapshots`

Dung de luu snapshot thong ke cho dashboard doc nhanh, tranh aggregate nang lien tuc.

```ts
{
  _id: ObjectId,
  scope: "SYSTEM" | "BRANCH" | "CAMPAIGN",
  scopeKey: string,
  branchId: ObjectId | null,
  campaignId: ObjectId | null,
  period: {
    type: "DAY" | "WEEK" | "MONTH" | "YEAR" | "ALL_TIME",
    from: Date,
    to: Date
  },
  metrics: {
    totalCampaigns: number,
    activeCampaigns: number,
    totalMoneyReceived: number,
    totalEstimatedItemValue: number,
    totalVolunteerHours: number,
    totalMoneyDistributed: number,
    totalEstimatedAidValue: number,
    beneficiaryCount: number,
    contributionCount: number,
    aidDistributionCount: number
  },
  builtAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Enum

- `scope`: `SYSTEM`, `BRANCH`, `CAMPAIGN`
- `period.type`: `DAY`, `WEEK`, `MONTH`, `YEAR`, `ALL_TIME`

### Object con

- `period`
- `metrics`

## 12. Cac truong mang quan trong

| Collection | Field mang | Chua gi |
|---|---|---|
| `users` | `permissions[]` | Danh sach quyen dang string |
| `campaigns` | `goals.targetItemSummary[]` | Muc tieu hien vat |
| `campaigns` | `requiredResources[]` | Nguon luc can cho chien dich |
| `campaigns` | `images[]` | Anh chien dich |
| `campaigns` | `documents[]` | Tai lieu chien dich |
| `contributions` | `itemDetails[]` | Cac hien vat dong gop |
| `contributions` | `proofs[]` | Bang chung dong gop |
| `beneficiaries` | `needs[]` | Nhu cau can ho tro |
| `beneficiaries` | `documents[]` | Tai lieu xac minh |
| `aid_distributions` | `itemSupports[]` | Cac hien vat da/du kien trao |
| `aid_distributions` | `proofs[]` | Bang chung trao ho tro |
| `volunteers` | `skills[]` | Ky nang tinh nguyen vien |
| `volunteers` | `availability[]` | Lich ranh |
| `volunteers` | `assignedCampaignIds[]` | Cac chien dich duoc gan |

## 13. Cac enum quan trong

### Role nguoi dung

```txt
SUPER_ADMIN
BRANCH_ADMIN
STAFF
CONTRIBUTOR
VOLUNTEER
```

### Trang thai tai khoan

```txt
ACTIVE
LOCKED
DISABLED
```

### Loai nguon luc dau vao

```txt
MONEY
ITEM
MEDICINE
CLOTHES
BOOK
SERVICE
VOLUNTEER_WORK
OTHER
```

### Trang thai dong gop

```txt
PENDING
CONFIRMED
RECEIVED
CANCELLED
REJECTED
REFUNDED
```

### Loai nguon luc dau ra

```txt
MONEY
ITEM
MEDICINE
CLOTHES
BOOK
SERVICE
MIXED
OTHER
```

### Trang thai phan phoi ho tro

```txt
PLANNED
APPROVED
DELIVERED
COMPLETED
CANCELLED
REJECTED
```

### Loai nguoi nhan ho tro

```txt
PERSON
FAMILY
ORGANIZATION
COMMUNITY
```

### Trang thai xac minh nguoi nhan ho tro

```txt
PENDING
VERIFIED
REJECTED
```

### Loai ky thong ke

```txt
DAY
WEEK
MONTH
YEAR
ALL_TIME
```

## 14. Luu y nghiep vu quan trong

- Cac collection nghiep vu theo chi nhanh nen co `branchId`: `campaigns`, `contributions`, `beneficiaries`, `aid_distributions`, `volunteers`, `activity_logs`, `stats_snapshots`.
- `contributions` va `aid_distributions` bat buoc luu snapshot de lich su bao cao khong bi sai khi ten campaign, branch, contributor hoac beneficiary thay doi.
- `campaigns.summaryStats` la nguon doc nhanh cho dashboard cap campaign.
- `stats_snapshots` la nguon doc nhanh cho dashboard cap branch va toan he thong.
- Cac collection tang truong nhanh duoc tai lieu uu tien shard la `contributions`, `aid_distributions`, `activity_logs`.
- Khong nen dung rieng `createdAt` lam shard key vi gia tri tang dan de tao hot shard.
