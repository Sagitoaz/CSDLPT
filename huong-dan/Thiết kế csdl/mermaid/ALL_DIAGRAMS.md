# Tất cả sơ đồ Mermaid

File này gom toàn bộ sơ đồ vào một tài liệu Markdown.

## Kiến trúc tổng thể hệ thống

**File:** `01_system_architecture.mmd`

Dùng ở phần phạm vi/kiến trúc ứng dụng để nhóm nhìn nhanh luồng từ trình duyệt đến MongoDB Replica Set hoặc Sharded Cluster.

```mermaid
%% 01_system_architecture.mmd
flowchart TB
    U["Người dùng / Máy trạm<br/>Donor, Staff, Admin, QA"] --> B["Trình duyệt người dùng"]
    B --> FE["Frontend React / Vite"]
    FE --> BE["Backend Node.js / Express<br/>API, JWT, RBAC, Validation"]
    BE --> DBGW{"Kết nối MongoDB"}

    DBGW --> RSConn["Connection string<br/>Replica Set"]
    DBGW --> Mongos["mongos<br/>Router của Sharded Cluster"]

    RSConn --> RS["Replica Set<br/>Primary + Secondary + Secondary"]
    Mongos --> CFG["Config Server<br/>Shard metadata"]
    Mongos --> S1["Shard 1 Replica Set"]
    Mongos --> S2["Shard 2 Replica Set"]
    Mongos --> S3["Shard 3 Replica Set"]
    Mongos --> S4["Shard 4 Replica Set"]

    BE --> LOG["activity_logs<br/>ghi audit mọi thao tác nghiệp vụ"]
    BE --> TX["MongoDB Transaction<br/>donation ảnh hưởng campaigns và donors"]

    classDef app fill:#e8f2ff,stroke:#2f70c0,stroke-width:1px;
    classDef db fill:#eef9ef,stroke:#2d7d3a,stroke-width:1px;
    classDef hot fill:#fff4e5,stroke:#d28b00,stroke-width:1px;
    class FE,BE app;
    class RS,Mongos,CFG,S1,S2,S3,S4,RSConn db;
    class LOG,TX hot;
```

## Bản đồ chức năng và dữ liệu truy cập

**File:** `02_data_domain_map.mmd`

Dùng để giải thích nghiệp vụ nào đụng đến collection nào, đồng thời nhấn mạnh donations và activity_logs là vùng nóng.

```mermaid
%% 02_data_domain_map.mmd
flowchart LR
    subgraph FUNC["Nhóm chức năng nghiệp vụ"]
        Login["Đăng nhập, phân quyền<br/>Tần suất: Cao"]
        BranchMgmt["Quản lý chi nhánh<br/>Tần suất: Trung bình"]
        CampaignMgmt["Quản lý chiến dịch<br/>Tần suất: Cao"]
        DonorMgmt["Quản lý nhà tài trợ<br/>Tần suất: Trung bình"]
        DonationFlow["Quyên góp<br/>Tần suất: Rất cao"]
        BeneficiaryMgmt["Người thụ hưởng<br/>Tần suất: Trung bình"]
        DisbursementFlow["Giải ngân<br/>Tần suất: Trung bình"]
        VolunteerMgmt["Tình nguyện viên<br/>Tần suất: Thấp - Trung bình"]
        Stats["Thống kê<br/>Tần suất: Cao"]
        Audit["Nhật ký hoạt động<br/>Tần suất: Rất cao"]
    end

    subgraph DATA["Bảng SQL logic / Collection MongoDB"]
        branches[(branches)]
        users[(users)]
        donors[(donors)]
        campaigns[(campaigns)]
        donations[(donations)]
        beneficiaries[(beneficiaries)]
        disbursements[(disbursements)]
        volunteers[(volunteers)]
        activity_logs[(activity_logs)]
    end

    Login --> users
    Login --> branches
    BranchMgmt --> branches
    BranchMgmt --> users
    CampaignMgmt --> campaigns
    CampaignMgmt --> branches
    CampaignMgmt --> users
    DonorMgmt --> donors
    DonorMgmt --> users
    DonationFlow --> donations
    DonationFlow --> campaigns
    DonationFlow --> donors
    BeneficiaryMgmt --> beneficiaries
    BeneficiaryMgmt --> campaigns
    DisbursementFlow --> disbursements
    DisbursementFlow --> beneficiaries
    DisbursementFlow --> campaigns
    VolunteerMgmt --> volunteers
    VolunteerMgmt --> campaigns
    Stats --> donations
    Stats --> campaigns
    Audit --> activity_logs

    classDef hot fill:#ffe8e8,stroke:#c92a2a,stroke-width:2px;
    classDef core fill:#e8f2ff,stroke:#2f70c0,stroke-width:1px;
    class donations,activity_logs hot;
    class branches,users,campaigns core;
```

## ERD SQL logic đầy đủ

**File:** `03_sql_logic_erd.mmd`

Dùng làm sơ đồ quan trọng nhất trong báo cáo: bảng, khóa chính, khóa ngoại và quan hệ nghiệp vụ.

```mermaid
%% 03_sql_logic_erd.mmd
%% ERD logic: có thể paste trực tiếp vào Mermaid Live Editor.
erDiagram
    BRANCHES {
        string id PK
        string code UK
        string name
        string type
        string parent_id FK
        string province
        string status
        datetime created_at
        datetime updated_at
    }

    USERS {
        string id PK
        string email UK
        string phone UK
        string password
        string full_name
        string role
        string branch_id FK
        json permissions
        boolean is_active
    }

    DONORS {
        string id PK
        string user_id FK
        string full_name
        string phone UK
        string email UK
        string donor_type
        decimal total_donated
    }

    CAMPAIGNS {
        string id PK
        string branch_id FK
        string code UK
        string title
        string type
        string status
        decimal target_amount
        decimal current_amount
        decimal disbursed_amount
        string organizer_id FK
        string created_by FK
    }

    DONATIONS {
        string id PK
        string branch_id FK
        string campaign_id FK
        string donor_id FK
        string donor_full_name
        string campaign_code
        decimal amount
        string payment_method
        string payment_status
        string transaction_code UK
        datetime donated_at
    }

    BENEFICIARIES {
        string id PK
        string branch_id FK
        string campaign_id FK
        string name
        string type
        string phone
        string verification_status
        string verified_by FK
        datetime verified_at
    }

    DISBURSEMENTS {
        string id PK
        string branch_id FK
        string campaign_id FK
        string beneficiary_id FK
        decimal amount
        string purpose
        string method
        string status
        string approved_by FK
        datetime disbursed_at
    }

    DISBURSEMENT_PROOFS {
        string id PK
        string disbursement_id FK
        string type
        string url
        string description
        datetime uploaded_at
        string uploaded_by FK
    }

    VOLUNTEERS {
        string id PK
        string branch_id FK
        string full_name
        string phone
        string email
        json skills
        string status
    }

    VOLUNTEER_CAMPAIGNS {
        string volunteer_id PK
        string campaign_id PK
    }

    ACTIVITY_LOGS {
        string id PK
        string branch_id FK
        string target_branch_id FK
        string actor_id FK
        string actor_role
        string action
        string entity_type
        string entity_id
        json before_data
        json after_data
        datetime created_at
    }

    BRANCHES ||--o{ BRANCHES : "parent-child"
    BRANCHES ||--o{ USERS : "has users"
    BRANCHES ||--o{ CAMPAIGNS : "owns campaigns"
    BRANCHES ||--o{ DONATIONS : "receives donations"
    BRANCHES ||--o{ BENEFICIARIES : "manages beneficiaries"
    BRANCHES ||--o{ DISBURSEMENTS : "handles disbursements"
    BRANCHES ||--o{ VOLUNTEERS : "manages volunteers"
    BRANCHES ||--o{ ACTIVITY_LOGS : "has logs"

    USERS ||--o{ CAMPAIGNS : "created_by / organizer"
    USERS ||--o{ BENEFICIARIES : "verified_by"
    USERS ||--o{ DISBURSEMENTS : "approved_by"
    USERS ||--o{ ACTIVITY_LOGS : "actor"
    USERS ||--o| DONORS : "linked account"

    DONORS ||--o{ DONATIONS : "makes"
    CAMPAIGNS ||--o{ DONATIONS : "receives"
    CAMPAIGNS ||--o{ BENEFICIARIES : "supports"
    CAMPAIGNS ||--o{ DISBURSEMENTS : "funds"
    BENEFICIARIES ||--o{ DISBURSEMENTS : "receives"
    DISBURSEMENTS ||--o{ DISBURSEMENT_PROOFS : "has proofs"
    VOLUNTEERS ||--o{ VOLUNTEER_CAMPAIGNS : "joins"
    CAMPAIGNS ||--o{ VOLUNTEER_CAMPAIGNS : "has volunteers"
```

## Mô hình document MongoDB và dữ liệu nhúng

**File:** `04_mongodb_document_model.mmd`

Dùng để giải thích vì sao MongoDB phù hợp: snapshot trong donations, location/proofs nhúng trong document.

```mermaid
%% 04_mongodb_document_model.mmd
flowchart LR
    branches[(branches<br/>code, type, parentId,<br/>province, status)]
    users[(users<br/>email, role, branchId,<br/>permissions, isActive)]
    donors[(donors<br/>userId, fullName,<br/>donorType, totalDonated)]
    campaigns[(campaigns<br/>branchId, code, title,<br/>status, targetAmount,<br/>currentAmount, disbursedAmount)]
    donations[(donations<br/>branchId, campaignId, donorId,<br/>amount, paymentStatus,<br/>transactionCode)]
    beneficiaries[(beneficiaries<br/>branchId, campaignId,<br/>name, verificationStatus)]
    disbursements[(disbursements<br/>branchId, campaignId,<br/>beneficiaryId, amount, status)]
    volunteers[(volunteers<br/>branchId, skills list,<br/>joinedCampaignIds list)]
    activity_logs[(activity_logs<br/>actor, action, entity,<br/>before and after snapshots)]

    subgraph EMBED["Dữ liệu nhúng trong document"]
        loc1["campaigns.location object"]
        imgs["campaigns.images array<br/>campaigns.proofImages array"]
        donorSnap["donations.donorSnapshot object"]
        campSnap["donations.campaignSnapshot object"]
        loc2["beneficiaries.location object"]
        proofs["disbursements.proofs array"]
        beforeAfter["activity_logs.before / after objects"]
    end

    branches --> users
    branches --> campaigns
    branches --> donations
    branches --> beneficiaries
    branches --> disbursements
    branches --> volunteers
    users --> donors
    campaigns --> donations
    donors --> donations
    campaigns --> beneficiaries
    campaigns --> disbursements
    beneficiaries --> disbursements
    volunteers -. joinedCampaignIds .-> campaigns

    campaigns --> loc1
    campaigns --> imgs
    donations --> donorSnap
    donations --> campSnap
    beneficiaries --> loc2
    disbursements --> proofs
    activity_logs --> beforeAfter

    classDef embed fill:#fff4e5,stroke:#d28b00,stroke-width:1px;
    class loc1,imgs,donorSnap,campSnap,loc2,proofs,beforeAfter embed;
```

## Phân quyền RBAC và lọc dữ liệu theo chi nhánh

**File:** `05_rbac_branch_scope.mmd`

Dùng để trình bày cơ chế bảo vệ dữ liệu: JWT, role, branchId và ngoại lệ SUPER_ADMIN.

```mermaid
%% 05_rbac_branch_scope.mmd
flowchart TB
    Request["Request từ Frontend"] --> JWT{"Có JWT hợp lệ?"}
    JWT -- "Không" --> Reject401["Từ chối 401 Unauthorized"]
    JWT -- "Có" --> Role{"Role của user"}

    Role -- "SUPER_ADMIN" --> AllScope["Phạm vi: toàn hệ thống<br/>Không giới hạn branchId"]
    Role -- "BRANCH_ADMIN" --> BranchAdmin["Phạm vi: trong chi nhánh<br/>Quản lý user, campaign, donation, stats, health"]
    Role -- "STAFF" --> Staff["Phạm vi: trong chi nhánh<br/>Tạo/sửa campaign, duyệt donation, xem thống kê"]
    Role -- "DONOR" --> Donor["Phạm vi: dữ liệu công khai<br/>và donation của chính mình"]

    BranchAdmin --> BranchFilter["Backend tự gắn điều kiện branchId"]
    Staff --> BranchFilter
    Donor --> PublicFilter["Lọc public campaign<br/>và donorId của user"]
    AllScope --> Query["Truy vấn MongoDB"]
    BranchFilter --> Query
    PublicFilter --> Query

    Query --> Audit["Ghi activity_logs<br/>actor, role, branch, before/after"]
    Audit --> Response["Trả response cho Frontend"]

    classDef deny fill:#ffe8e8,stroke:#c92a2a,stroke-width:1px;
    classDef ok fill:#eef9ef,stroke:#2d7d3a,stroke-width:1px;
    class Reject401 deny;
    class AllScope,BranchFilter,PublicFilter,Query ok;
```

## Nhóm dữ liệu theo tần suất truy cập

**File:** `06_access_frequency_groups.mmd`

Dùng để giải thích nhanh bảng tần suất H/L, đọc/ghi/sửa/xóa ở trụ sở và chi nhánh.

```mermaid
%% 06_access_frequency_groups.mmd
flowchart TB
    subgraph HOT["Rất cao / cần tối ưu đầu tiên"]
        Donation["Donation<br/>H.WEDR tại trụ sở và trạm<br/>Tăng nhanh nhất"]
        ActivityLog["ActivityLog<br/>H.W tại trạm, H.R tại trụ sở<br/>Ghi audit liên tục"]
    end

    subgraph HIGH["Cao / nghiệp vụ thường xuyên"]
        User["User<br/>đăng nhập, phân quyền"]
        Campaign["Campaign<br/>tạo, sửa, đóng/mở, thống kê"]
        Stats["Stats<br/>aggregate từ donations và campaigns"]
    end

    subgraph MEDIUM["Trung bình / theo nghiệp vụ chi nhánh"]
        Donor["Donor<br/>tra cứu, cập nhật tổng tiền"]
        Beneficiary["Beneficiary<br/>xác minh hồ sơ"]
        Disbursement["Disbursement<br/>duyệt và hoàn tất giải ngân"]
        Volunteer["Volunteer<br/>quản lý tham gia chiến dịch"]
    end

    subgraph CORE["Dữ liệu lõi / đọc nhiều"]
        Branch["Branch<br/>trục phân quyền và phân mảnh"]
    end

    Branch --> User
    Branch --> Campaign
    Branch --> Donation
    Branch --> Beneficiary
    Branch --> Disbursement
    Branch --> Volunteer
    Donation --> Stats
    ActivityLog --> AuditView["Màn hình audit / truy vết"]

    classDef hot fill:#ffe8e8,stroke:#c92a2a,stroke-width:2px;
    classDef core fill:#e8f2ff,stroke:#2f70c0,stroke-width:1px;
    class Donation,ActivityLog hot;
    class Branch,User,Campaign core;
```

## Chiến lược chỉ mục dữ liệu

**File:** `07_index_strategy.mmd`

Dùng để trình bày các index quan trọng và use case: đăng nhập, lọc theo chi nhánh, thống kê donation, audit.

```mermaid
%% 07_index_strategy.mmd
flowchart LR
    subgraph AUTH["Đăng nhập và phân quyền"]
        IDX_USER_EMAIL["users<br/>{ email: 1 } unique"]
        IDX_USER_PHONE["users<br/>{ phone: 1 } unique sparse"]
        IDX_USER_BRANCH_ROLE["users<br/>{ branchId: 1, role: 1 }"]
    end

    subgraph CAMPAIGN["Quản lý chiến dịch"]
        IDX_CAMP_CODE["campaigns<br/>{ code: 1 } unique"]
        IDX_CAMP_BRANCH_STATUS["campaigns<br/>{ branchId: 1, status: 1, createdAt: -1 }"]
        IDX_CAMP_BRANCH_TYPE["campaigns<br/>{ branchId: 1, type: 1, createdAt: -1 }"]
    end

    subgraph DONATION["Donation: collection nóng nhất"]
        IDX_TX["donations<br/>{ transactionCode: 1 } unique"]
        IDX_DON_BRANCH_CAMP_DATE["donations<br/>{ branchId: 1, campaignId: 1, donatedAt: -1 }"]
        IDX_DON_CAMP_STATUS_DATE["donations<br/>{ campaignId: 1, paymentStatus: 1, donatedAt: -1 }"]
        IDX_DON_DONOR_DATE["donations<br/>{ donorId: 1, donatedAt: -1 }"]
    end

    subgraph AUDIT["Audit và truy vết"]
        IDX_LOG_BRANCH_DATE["activity_logs<br/>{ branchId: 1, createdAt: -1 }"]
        IDX_LOG_ENTITY_DATE["activity_logs<br/>{ entityType: 1, entityId: 1, createdAt: -1 }"]
    end

    QueryLogin["Use case: đăng nhập"] --> IDX_USER_EMAIL
    QueryCampaign["Use case: list campaign theo chi nhánh"] --> IDX_CAMP_BRANCH_STATUS
    QueryDonation["Use case: xem donation theo chiến dịch"] --> IDX_DON_BRANCH_CAMP_DATE
    QueryStats["Use case: thống kê theo trạng thái"] --> IDX_DON_CAMP_STATUS_DATE
    QueryAudit["Use case: audit theo đối tượng"] --> IDX_LOG_ENTITY_DATE

    classDef hot fill:#ffe8e8,stroke:#c92a2a,stroke-width:2px;
    class IDX_TX,IDX_DON_BRANCH_CAMP_DATE,IDX_DON_CAMP_STATUS_DATE,IDX_DON_DONOR_DATE hot;
```

## Phân mảnh ngang dẫn xuất theo branchId

**File:** `08_horizontal_fragmentation_branchid.mmd`

Dùng cho phần thiết kế CSDL phân tán: branches là gốc, các collection nghiệp vụ phân mảnh theo chi nhánh.

```mermaid
%% 08_horizontal_fragmentation_branchid.mmd
flowchart TB
    GBranches[(branches toàn cục)] --> BR_HCM["BR_HCM<br/>branches.code = HCM"]
    GBranches --> BR_DNG["BR_DNG<br/>branches.code = DNG"]
    GBranches --> BR_HQ["BR_HQ<br/>branches.code = HQ"]
    GBranches --> BR_OTHER["BR_OTHER<br/>các chi nhánh còn lại"]

    BR_HCM --> CAM_HCM[(CAMPAIGNS_HCM)]
    BR_HCM --> DON_HCM[(DONATIONS_HCM)]
    BR_HCM --> BEN_HCM[(BENEFICIARIES_HCM)]
    BR_HCM --> DIS_HCM[(DISBURSEMENTS_HCM)]
    BR_HCM --> VOL_HCM[(VOLUNTEERS_HCM)]
    BR_HCM --> LOG_HCM[(LOGS_HCM)]

    BR_DNG --> CAM_DNG[(CAMPAIGNS_DNG)]
    BR_DNG --> DON_DNG[(DONATIONS_DNG)]
    BR_DNG --> BEN_DNG[(BENEFICIARIES_DNG)]
    BR_DNG --> DIS_DNG[(DISBURSEMENTS_DNG)]
    BR_DNG --> VOL_DNG[(VOLUNTEERS_DNG)]
    BR_DNG --> LOG_DNG[(LOGS_DNG)]

    BR_OTHER --> CAM_OTHER[(CAMPAIGNS_OTHER)]
    BR_OTHER --> DON_OTHER[(DONATIONS_OTHER)]
    BR_OTHER --> LOG_OTHER[(LOGS_OTHER)]

    Note["Nguyên tắc: mọi collection nghiệp vụ có branchId<br/>Backend lọc branchId; MongoDB shard/routing theo shard key"]
    Note -.-> DON_HCM
    Note -.-> DON_DNG
    Note -.-> DON_OTHER

    classDef root fill:#e8f2ff,stroke:#2f70c0,stroke-width:1px;
    classDef frag fill:#eef9ef,stroke:#2d7d3a,stroke-width:1px;
    class GBranches,BR_HCM,BR_DNG,BR_HQ,BR_OTHER root;
    class CAM_HCM,DON_HCM,BEN_HCM,DIS_HCM,VOL_HCM,LOG_HCM,CAM_DNG,DON_DNG,BEN_DNG,DIS_DNG,VOL_DNG,LOG_DNG,CAM_OTHER,DON_OTHER,LOG_OTHER frag;
```

## Định vị dữ liệu theo mô hình 6 máy

**File:** `09_six_machine_deployment.mmd`

Dùng cho phần cài đặt vật lý/định vị: máy 1 chạy ứng dụng và mongos, máy 2 trung tâm, máy 3-6 làm shard.

```mermaid
%% 09_six_machine_deployment.mmd
flowchart TB
    M1["Máy 1<br/>Frontend + Backend + QA + mongos"]
    M2["Máy 2<br/>Replica set trung tâm / config<br/>branches, users, metadata lõi"]
    M3["Máy 3<br/>Shard 1 RS<br/>campaigns_HCM, donations_HCM"]
    M4["Máy 4<br/>Shard 2 RS<br/>campaigns_DNG, donations_DNG"]
    M5["Máy 5<br/>Shard 3 RS<br/>campaigns_other, donations_other"]
    M6["Máy 6<br/>Shard 4 RS<br/>mở rộng chi nhánh / log nóng"]

    Client["Máy trạm / trình duyệt"] --> M1
    M1 --> M2
    M1 --> M3
    M1 --> M4
    M1 --> M5
    M1 --> M6

    subgraph VPN["Mạng VPN / LAN thực nghiệm"]
        M1
        M2
        M3
        M4
        M5
        M6
    end

    M3 <--> R3["Replica Set Shard 1<br/>Primary + Secondary + Secondary"]
    M4 <--> R4["Replica Set Shard 2<br/>Primary + Secondary + Secondary"]
    M5 <--> R5["Replica Set Shard 3<br/>Primary + Secondary + Secondary"]
    M6 <--> R6["Replica Set Shard 4<br/>Primary + Secondary + Secondary"]

    classDef app fill:#e8f2ff,stroke:#2f70c0,stroke-width:1px;
    classDef db fill:#eef9ef,stroke:#2d7d3a,stroke-width:1px;
    class M1 app;
    class M2,M3,M4,M5,M6,R3,R4,R5,R6 db;
```

## Lược đồ ánh xạ Global Schema và Local Schema

**File:** `10_global_local_mapping.mmd`

Dùng để minh họa công thức union giữa fragment cục bộ và schema toàn cục trong môi trường phân tán.

```mermaid
%% 10_global_local_mapping.mmd
flowchart TB
    subgraph G["Global schema G"]
        GBranches[(branches)]
        GUsers[(users)]
        GDonors[(donors)]
        GCampaigns[(campaigns)]
        GDonations[(donations)]
        GBeneficiaries[(beneficiaries)]
        GDisbursements[(disbursements)]
        GVolunteers[(volunteers)]
        GLogs[(activity_logs)]
    end

    subgraph LHCM["Local schema L_HCM"]
        HCM_C[(campaigns_HCM)]
        HCM_D[(donations_HCM)]
        HCM_B[(beneficiaries_HCM)]
        HCM_DS[(disbursements_HCM)]
        HCM_V[(volunteers_HCM)]
        HCM_L[(logs_HCM)]
    end

    subgraph LDNG["Local schema L_DNG"]
        DNG_C[(campaigns_DNG)]
        DNG_D[(donations_DNG)]
        DNG_B[(beneficiaries_DNG)]
        DNG_DS[(disbursements_DNG)]
        DNG_V[(volunteers_DNG)]
        DNG_L[(logs_DNG)]
    end

    subgraph LOTHER["Local schema L_OTHER"]
        O_C[(campaigns_other)]
        O_D[(donations_other)]
        O_B[(beneficiaries_other)]
        O_DS[(disbursements_other)]
        O_V[(volunteers_other)]
        O_L[(logs_other)]
    end

    HCM_C --> U1["union"]
    DNG_C --> U1
    O_C --> U1
    U1 --> GCampaigns

    HCM_D --> U2["union"]
    DNG_D --> U2
    O_D --> U2
    U2 --> GDonations

    HCM_B --> U3["union"]
    DNG_B --> U3
    O_B --> U3
    U3 --> GBeneficiaries

    HCM_DS --> U4["union"]
    DNG_DS --> U4
    O_DS --> U4
    U4 --> GDisbursements

    HCM_L --> U5["union"]
    DNG_L --> U5
    O_L --> U5
    U5 --> GLogs

    MongoS["mongos tự ánh xạ<br/>dựa trên shard key và config metadata"] -.-> U1
    MongoS -.-> U2
    MongoS -.-> U5
```

## Nhân bản Replica Set và failover

**File:** `11_replication_failover.mmd`

Dùng để chứng minh đồng bộ dữ liệu, oplog replication và chuyển primary khi node lỗi.

```mermaid
%% 11_replication_failover.mmd
sequenceDiagram
    autonumber
    participant App as Backend Express
    participant P as MongoDB Primary
    participant O as Oplog
    participant S1 as Secondary 1
    participant S2 as Secondary 2
    participant M as Replica Set Election

    App->>P: Ghi dữ liệu nghiệp vụ
    P->>O: Ghi operation vào oplog
    O-->>S1: Secondary kéo oplog và apply
    O-->>S2: Secondary kéo oplog và apply
    S1-->>App: Có thể đọc kiểm tra sau khi replicate

    Note over P,S2: Khi Primary lỗi
    P--xM: Primary down
    M->>S1: Bầu chọn node mới
    S1-->>App: S1 trở thành Primary mới
    App->>S1: Tiếp tục ghi dữ liệu
```

## Luồng giao tác tạo donation

**File:** `12_create_donation_sequence.mmd`

Dùng để trình bày transaction quan trọng nhất: insert donations, cập nhật campaigns.currentAmount, donors.totalDonated và ghi audit.

```mermaid
%% 12_create_donation_sequence.mmd
sequenceDiagram
    autonumber
    actor User as Donor / Staff
    participant FE as Frontend React
    participant BE as Backend Express
    participant Auth as JWT + RBAC
    participant Camp as campaigns
    participant Donor as donors
    participant Tx as MongoDB Transaction
    participant Donation as donations
    participant Log as activity_logs
    participant RS as Replica Set / Shard

    User->>FE: Nhập thông tin quyên góp
    FE->>BE: POST /api/donations
    BE->>Auth: Kiểm tra JWT và branch scope
    Auth-->>BE: Hợp lệ
    BE->>Camp: Đọc campaign theo campaignId
    BE->>Donor: Đọc donor theo donorId
    BE->>Tx: Bắt đầu transaction
    Tx->>Donation: insert donation kèm donorSnapshot và campaignSnapshot
    alt paymentStatus = SUCCESS
        Tx->>Camp: tăng currentAmount
        Tx->>Donor: tăng totalDonated
    else PENDING / FAILED
        Tx-->>Tx: chưa cộng vào tổng tiền
    end
    Tx->>Log: ghi activity_logs
    Tx-->>BE: commit transaction
    BE->>RS: Replica Set đồng bộ sang secondary
    BE-->>FE: Trả kết quả tạo donation
    FE-->>User: Hiển thị mã giao dịch
```

## Luồng cập nhật trạng thái donation

**File:** `13_update_donation_status_sequence.mmd`

Dùng để giải thích cách tính delta tiền khi PENDING/FAILED chuyển SUCCESS hoặc SUCCESS chuyển REFUNDED.

```mermaid
%% 13_update_donation_status_sequence.mmd
sequenceDiagram
    autonumber
    actor Staff as Staff / Admin
    participant FE as Frontend React
    participant BE as Backend Express
    participant Auth as JWT + RBAC
    participant Donation as donations
    participant Tx as MongoDB Transaction
    participant Camp as campaigns
    participant Donor as donors
    participant Log as activity_logs

    Staff->>FE: Duyệt hoặc đổi trạng thái donation
    FE->>BE: PATCH /api/donations/:id/status
    BE->>Auth: Kiểm tra quyền và branch scope
    Auth-->>BE: Hợp lệ
    BE->>Donation: Đọc donation hiện tại
    BE->>BE: Tính delta tiền theo trạng thái cũ và mới
    BE->>Tx: Bắt đầu transaction
    Tx->>Donation: Cập nhật paymentStatus

    alt PENDING/FAILED -> SUCCESS
        Tx->>Camp: currentAmount = currentAmount + amount
        Tx->>Donor: totalDonated = totalDonated + amount
    else SUCCESS -> REFUNDED
        Tx->>Camp: currentAmount = currentAmount - amount
        Tx->>Donor: totalDonated = totalDonated - amount
    else Không ảnh hưởng tổng tiền
        Tx-->>Tx: chỉ cập nhật trạng thái
    end

    Tx->>Log: Ghi before và after
    Tx-->>BE: commit transaction
    BE-->>FE: Trả trạng thái mới
    FE-->>Staff: Hiển thị kết quả cập nhật
```

## Luồng thống kê dashboard

**File:** `14_statistics_aggregation_sequence.mmd`

Dùng để trình bày vì sao không cần lưu stats riêng: dùng aggregation từ donations và campaigns.

```mermaid
%% 14_statistics_aggregation_sequence.mmd
sequenceDiagram
    autonumber
    actor Admin as Admin / Staff
    participant FE as Frontend Dashboard
    participant BE as Backend Express
    participant Auth as JWT + RBAC
    participant Donations as donations
    participant Campaigns as campaigns
    participant Mongo as MongoDB Aggregation

    Admin->>FE: Mở dashboard thống kê
    FE->>BE: GET /api/stats/overview
    BE->>Auth: Kiểm tra JWT, role, branchId
    Auth-->>BE: Trả scope dữ liệu
    BE->>Mongo: Build pipeline aggregate

    alt Không phải SUPER_ADMIN
        Mongo->>Donations: match branchId + paymentStatus
        Mongo->>Campaigns: match branchId + status
    else SUPER_ADMIN
        Mongo->>Donations: aggregate toàn hệ thống
        Mongo->>Campaigns: count toàn hệ thống
    end

    Donations-->>Mongo: Tổng tiền, số giao dịch, trạng thái
    Campaigns-->>Mongo: Số campaign ACTIVE/inactive
    Mongo-->>BE: Kết quả tổng hợp
    BE-->>FE: JSON thống kê
    FE-->>Admin: Biểu đồ dashboard
```

## Luồng ghi và truy vết activity_logs

**File:** `15_activity_log_audit_flow.mmd`

Dùng để nhấn mạnh audit không sửa/xóa thủ công, lưu actor, vai trò, branch, dữ liệu trước/sau.

```mermaid
%% 15_activity_log_audit_flow.mmd
flowchart TB
    Action["Thao tác nghiệp vụ<br/>create / update / approve / refund"] --> Guard["Backend kiểm tra JWT, role, branchId"]
    Guard --> ReadBefore["Đọc dữ liệu trước thay đổi<br/>before_data"]
    ReadBefore --> WriteBusiness["Ghi dữ liệu nghiệp vụ<br/>campaigns, donations, donors, ..."]
    WriteBusiness --> ReadAfter["Lấy dữ liệu sau thay đổi<br/>after_data"]
    ReadAfter --> LogDoc["Tạo activity_logs document"]

    subgraph LOG_FIELDS["Trường quan trọng trong activity_logs"]
        Actor["actorId, actorRole, actorBranchId"]
        Branch["branchId, targetBranchId"]
        Entity["entityType, entityId"]
        Data["before{}, after{}"]
        Client["ipAddress, userAgent"]
        Time["createdAt"]
    end

    LogDoc --> Actor
    LogDoc --> Branch
    LogDoc --> Entity
    LogDoc --> Data
    LogDoc --> Client
    LogDoc --> Time

    LogDoc --> Index1["Index: { branchId: 1, createdAt: -1 }"]
    LogDoc --> Index2["Index: { entityType: 1, entityId: 1, createdAt: -1 }"]
    Index1 --> AuditByBranch["Xem log theo chi nhánh"]
    Index2 --> AuditByEntity["Truy vết lịch sử một đối tượng"]

    classDef audit fill:#fff4e5,stroke:#d28b00,stroke-width:1px;
    class LogDoc,Actor,Branch,Entity,Data,Client,Time audit;
```

## Cây quyết định chọn shard key cho donations

**File:** `16_shard_key_decision.mmd`

Dùng để giải thích lựa chọn khuyến nghị: campaignId hashed vì đúng schema hiện tại.

```mermaid
%% 16_shard_key_decision.mmd
flowchart TB
    Start["Collection donations tăng nhanh nhất"] --> NeedShard{"Cần phân tán ghi và truy vấn?"}
    NeedShard -- "Có" --> Schema{"Schema hiện tại có campaignId top-level?"}
    NeedShard -- "Chưa" --> KeepIndex["Giữ index nghiệp vụ<br/>{ branchId: 1, campaignId: 1, donatedAt: -1 }"]

    Schema -- "Có" --> Recommend["Khuyến nghị<br/>Shard key: { campaignId: hashed }"]
    Schema -- "Muốn giải thích theo mã chiến dịch" --> Snapshot["Dùng { campaignSnapshot.code: hashed }<br/>hoặc bổ sung field campaignCode top-level"]

    Recommend --> Cmd1["db.donations.createIndex({ campaignId: &quot;hashed&quot; })"]
    Cmd1 --> Cmd2["sh.shardCollection(charity_distributed.donations,<br/>{ campaignId: &quot;hashed&quot; })"]

    Snapshot --> Warn["Lưu ý: campaignCode không phải top-level<br/>nếu không bổ sung field thì không nên dùng campaignCode"]

    Recommend --> Benefit1["Phân phối donation theo chiến dịch"]
    Recommend --> Benefit2["Khớp schema và code hiện tại"]
    KeepIndex --> Benefit3["Truy vấn theo chi nhánh vẫn nhanh"]

    classDef rec fill:#eef9ef,stroke:#2d7d3a,stroke-width:2px;
    classDef warn fill:#fff4e5,stroke:#d28b00,stroke-width:1px;
    class Recommend,Cmd1,Cmd2 rec;
    class Snapshot,Warn warn;
```

## Vòng đời trạng thái thanh toán donation

**File:** `17_donation_payment_state.mmd`

Dùng kèm hai sequence diagram để người xem hiểu tác động của từng trạng thái lên tổng tiền.

```mermaid
%% 17_donation_payment_state.mmd
stateDiagram-v2
    [*] --> PENDING: tạo donation
    PENDING --> SUCCESS: thanh toán thành công
    PENDING --> FAILED: thanh toán lỗi
    FAILED --> SUCCESS: xác nhận lại thành công
    SUCCESS --> REFUNDED: hoàn tiền
    REFUNDED --> [*]
    FAILED --> [*]

    note right of SUCCESS
        Cộng amount vào
        campaigns.currentAmount
        donors.totalDonated
    end note

    note right of REFUNDED
        Trừ amount khỏi
        campaigns.currentAmount
        donors.totalDonated
    end note
```

## Thứ tự trình bày sơ đồ trong báo cáo/thuyết trình

**File:** `18_report_slide_order.mmd`

Dùng như một sơ đồ dẫn chuyện để nhóm biết nên đưa hình nào trước, hình nào sau.

```mermaid
%% 18_report_slide_order.mmd
flowchart TD
    A["1. Kiến trúc tổng thể<br/>01_system_architecture"] --> B["2. Bản đồ chức năng - dữ liệu<br/>02_data_domain_map"]
    B --> C["3. ERD SQL logic<br/>03_sql_logic_erd"]
    C --> D["4. MongoDB document model<br/>04_mongodb_document_model"]
    D --> E["5. RBAC và branch scope<br/>05_rbac_branch_scope"]
    E --> F["6. Tần suất và collection nóng<br/>06_access_frequency_groups"]
    F --> G["7. Index strategy<br/>07_index_strategy"]
    G --> H["8. Phân mảnh ngang branchId<br/>08_horizontal_fragmentation_branchid"]
    H --> I["9. Định vị 6 máy<br/>09_six_machine_deployment"]
    I --> J["10. Global - Local mapping<br/>10_global_local_mapping"]
    J --> K["11. Giao tác donation và thống kê<br/>12, 13, 14"]
    K --> L["12. Audit, shard key, failover<br/>11, 15, 16, 17"]
```

