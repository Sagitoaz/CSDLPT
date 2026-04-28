# MongoDB User & Role Setup Script
# Purpose: Create MongoDB users with appropriate roles and permissions
# Usage: mongosh < mongodb-setup-users.js
# Or: mongosh mongodb://127.0.0.1:27017 < mongodb-setup-users.js

# =============================================================================
# SECURITY CONFIGURATION
# SECURITY-06: Least-privilege access
# SECURITY-01: Database-level role-based access control
# =============================================================================

# Switch to admin database for user creation
use admin;

# =============================================================================
# 1. Create Root/Admin User (Full Access)
# Use this for application backend to perform all operations
# =============================================================================

print("=== Creating admin user: charity_admin ===");

db.createUser({
  user: "charity_admin",
  pwd: "charity_admin_secure_password_change_me",
  roles: [
    {
      role: "dbOwner",
      db: "charity_distributed"
    },
    {
      role: "dbAdmin",
      db: "admin"
    }
  ]
});

print("✓ Created admin user: charity_admin");

# =============================================================================
# 2. Switch to charity_distributed database for specific role creation
# =============================================================================

use charity_distributed;

# =============================================================================
# 3. Create Custom Roles (if needed for finer-grained control)
# =============================================================================

print("=== Creating custom roles ===");

# Reader role - Read-only access to all collections
db.createRole({
  role: "charity_reader",
  privileges: [
    {
      resource: {
        db: "charity_distributed",
        collection: ""
      },
      actions: ["find", "collStats"]
    }
  ],
  roles: []
});

print("✓ Created role: charity_reader");

# Writer role - Read/Write access for operations
db.createRole({
  role: "charity_writer",
  privileges: [
    {
      resource: {
        db: "charity_distributed",
        collection: ""
      },
      actions: [
        "find",
        "insert",
        "update",
        "remove",
        "collStats",
        "createIndex"
      ]
    }
  ],
  roles: []
});

print("✓ Created role: charity_writer");

# =============================================================================
# 4. Create Application-Level Users
# =============================================================================

print("=== Creating application users ===");

# Main application backend user (Read/Write)
db.createUser({
  user: "charity_backend",
  pwd: "charity_backend_password_change_me",
  roles: [
    {
      role: "readWrite",
      db: "charity_distributed"
    },
    {
      role: "dbAdmin",
      db: "charity_distributed"
    }
  ]
});

print("✓ Created user: charity_backend");

# Reporting/Analytics user (Read-Only)
db.createUser({
  user: "charity_reporter",
  pwd: "charity_reporter_password_change_me",
  roles: [
    {
      role: "charity_reader",
      db: "charity_distributed"
    }
  ]
});

print("✓ Created user: charity_reporter");

# Backup user (with backup privilege)
db.createUser({
  user: "charity_backup",
  pwd: "charity_backup_password_change_me",
  roles: [
    {
      role: "backup",
      db: "admin"
    },
    {
      role: "read",
      db: "charity_distributed"
    }
  ]
});

print("✓ Created user: charity_backup");

# =============================================================================
# 5. Verify Users Created
# =============================================================================

print("\n=== Listing all users in charity_distributed ===");
db.getUsers();

print("\n=== Admin users ===");
use admin;
db.getUsers();

# =============================================================================
# 6. Connection Examples
# =============================================================================

print("\n=== Connection Examples ===");

print("1. Admin (full access):");
print("   mongosh 'mongodb://charity_admin:password@127.0.0.1:27017/charity_distributed'");

print("\n2. Backend Application (read/write):");
print("   mongosh 'mongodb://charity_backend:password@127.0.0.1:27017/charity_distributed'");

print("\n3. Reporter (read-only):");
print("   mongosh 'mongodb://charity_reporter:password@127.0.0.1:27017/charity_distributed'");

print("\n4. Backup (backup operations):");
print("   mongosh 'mongodb://charity_backup:password@127.0.0.1:27017/admin'");

print("\n=== Setup Complete ===");
