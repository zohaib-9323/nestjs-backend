# Company-User Association Implementation Guide

## Overview
Companies are now created with an explicit `userId` in the request body and are permanently associated with that user as the creator/owner.

## Key Changes

### 1. Company Creation
- **Endpoint**: `POST /companies`
- **Required Fields**:
  ```json
  {
    "name": "Company Name",
    "websiteUrl": "https://example.com",
    "phoneNumber": "+1234567890",
    "userId": "507f1f77bcf86cd799439011"  // ← NEW FIELD
  }
  ```

### 2. Data Model
```typescript
Company {
  _id: ObjectId
  name: string
  websiteUrl: string
  phoneNumber: string
  ownerId: ObjectId  // ← The user who created this company
  members: ObjectId[]
  products: ObjectId[]
  projects: ObjectId[]
  offers: ObjectId[]
}

User {
  _id: ObjectId
  email: string
  companies: ObjectId[]  // ← Companies this user created
}
```

### 3. Authorization Rules
- **SuperAdmin**: Can see all companies
- **Regular Users**: Can only see companies they created (where they are the owner)
- **Company Owner**: Full access to their companies
- **Members**: Can be added to companies but this doesn't affect ownership

## Testing Guide

### Step 1: Register/Login as User A
```bash
POST /auth/register
{
  "email": "userA@example.com",
  "password": "password123",
  "firstName": "User",
  "lastName": "A"
}

# Get the access token and userId from response
```

### Step 2: Create Company for User A
```bash
POST /companies
Headers: { "Authorization": "Bearer <userA_token>" }
Body:
{
  "name": "User A Company",
  "websiteUrl": "https://companya.com",
  "phoneNumber": "+1111111111",
  "userId": "<userA_id>"  // ← Must match User A's ID
}

# Response will include the company with ownerId set to userA_id
```

### Step 3: Verify Company Appears for User A
```bash
GET /companies
Headers: { "Authorization": "Bearer <userA_token>" }

# Should return:
[
  {
    "id": "...",
    "name": "User A Company",
    "ownerId": "<userA_id>",
    ...
  }
]
```

### Step 4: Register/Login as User B
```bash
POST /auth/register
{
  "email": "userB@example.com",
  "password": "password123",
  "firstName": "User",
  "lastName": "B"
}

# Get the access token and userId from response
```

### Step 5: Create Company for User B
```bash
POST /companies
Headers: { "Authorization": "Bearer <userB_token>" }
Body:
{
  "name": "User B Company",
  "websiteUrl": "https://companyb.com",
  "phoneNumber": "+2222222222",
  "userId": "<userB_id>"  // ← Must match User B's ID
}
```

### Step 6: Verify Data Isolation
**As User A:**
```bash
GET /companies
Headers: { "Authorization": "Bearer <userA_token>" }

# Should ONLY return User A's company
[
  {
    "name": "User A Company",
    "ownerId": "<userA_id>",
    ...
  }
]
```

**As User B:**
```bash
GET /companies
Headers: { "Authorization": "Bearer <userB_token>" }

# Should ONLY return User B's company
[
  {
    "name": "User B Company",
    "ownerId": "<userB_id>",
    ...
  }
]
```

### Step 7: Verify User Cannot Access Other Company
```bash
# Try to get User A's company as User B
GET /companies/<userA_company_id>
Headers: { "Authorization": "Bearer <userB_token>" }

# Should return 403 Forbidden
```

## Backend Logs
The implementation includes detailed logging:

```
[CompaniesController] Create company request: {
  requestedUserId: '507f1f77bcf86cd799439011',
  authenticatedUser: '507f1f77bcf86cd799439011',
  userRole: 'USER',
  companyData: { name: 'Test Company', ... }
}

[CompaniesService] Creating company for user: {
  userId: '507f1f77bcf86cd799439011',
  userEmail: 'user@example.com',
  companyName: 'Test Company'
}

[CompaniesService] Company created successfully: {
  companyId: '507f1f77bcf86cd799439012',
  ownerId: '507f1f77bcf86cd799439011',
  createdForUserId: '507f1f77bcf86cd799439011'
}

[CompaniesService] User companies array updated
```

## API Documentation
Full API documentation is available at: `http://localhost:3000/api`

### Key Endpoints:
- `POST /companies` - Create company (requires userId in body)
- `GET /companies` - Get companies created by authenticated user
- `GET /companies/:id` - Get specific company (ownership verified)
- `PATCH /companies/:id` - Update company (owner only)
- `POST /companies/:id/members/:userId` - Add member (owner only)
- `DELETE /companies/:id/members/:userId` - Remove member (owner only)
- `DELETE /companies/:id` - Delete company (admin/superadmin only)

## Database Verification
```javascript
// In MongoDB shell or Compass:

// 1. Find all companies for a user
db.companies.find({ ownerId: ObjectId("507f1f77bcf86cd799439011") })

// 2. Find user and their companies array
db.users.findOne({ _id: ObjectId("507f1f77bcf86cd799439011") })

// 3. Verify bidirectional relationship
const user = db.users.findOne({ email: "user@example.com" })
const companies = db.companies.find({ ownerId: user._id })
// companies._id should be in user.companies array
```

## Security Considerations
1. **Multi-tenant isolation**: Users can only see their own companies
2. **Ownership verification**: All operations verify ownerId
3. **JWT authentication**: Required for all company endpoints
4. **Role-based access**: SuperAdmin has override access
5. **Member vs Owner**: Members can be added but owner controls the company

## Common Issues

### Issue 1: "User not found"
**Cause**: Invalid userId provided in the request body
**Solution**: Ensure userId matches an existing user's _id

### Issue 2: "You do not have access to this company"
**Cause**: User trying to access a company they didn't create
**Solution**: This is expected behavior - users can only access their own companies

### Issue 3: Empty companies array
**Cause**: User hasn't created any companies yet
**Solution**: Create a company with POST /companies using their userId

## Best Practices
1. Always use the correct userId when creating companies
2. Store user's _id when they login for use in company creation
3. Check logs for detailed debugging information
4. Use SuperAdmin account only for administrative tasks
5. Regularly verify bidirectional relationships (User.companies ↔ Company.ownerId)

