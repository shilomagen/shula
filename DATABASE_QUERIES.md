# Database Queries Analysis and Optimization

This document analyzes all database queries in the backend application and provides optimization recommendations.

## Table of Contents
1. [Media Distributions](#media-distributions)
2. [Person Participants](#person-participants)
3. [Conversations](#conversations)
4. [Persons](#persons)
5. [Groups](#groups)
6. [Group Participants](#group-participants)
7. [Group Persons](#group-persons)
8. [Participants](#participants)

## Media Distributions

### Queries Found:
1. `findMany()` - Get all media distributions
   - Current indexes: Composite primary key on `[photoId, participantId]`
   - Performance: Good for small datasets, but might need pagination
   - Recommendation: Add pagination and filtering capabilities

2. `findUnique({ where: { photoId_participantId } })`
   - Current indexes: Uses primary key
   - Performance: Optimal (uses primary key)

3. `create()` - Create new media distribution
   - Current indexes: Sufficient with existing PK
   - Performance: Optimal

4. `update()` - Update media distribution status
   - Current indexes: Uses primary key lookup
   - Performance: Optimal

5. `delete()` - Delete media distribution
   - Current indexes: Uses primary key lookup
   - Performance: Optimal

## Person Participants

### Queries Found:
1. `findMany({ where: { participantId } })`
   - Current indexes: Composite primary key on `[participantId, personId]`
   - Performance: Good for lookups by participantId
   - Recommendation: Consider adding a separate index on `participantId` if frequently querying without `personId`

## Conversations

### Queries Found:
1. `findMany({ where: { participantId } })`
   - Current indexes: No specific index for participantId
   - Recommendation: Add index on `participantId`
   ```prisma
   @@index([participantId])
   ```

2. `findUnique({ where: { id } })`
   - Current indexes: Primary key
   - Performance: Optimal

3. `findFirst({ where: { participantId, status } })`
   - Current indexes: None specific
   - Recommendation: Add composite index
   ```prisma
   @@index([participantId, status])
   ```

4. `Message.findMany({ where: { conversationId } })`
   - Current indexes: None specific
   - Recommendation: Add index on conversationId
   ```prisma
   @@index([conversationId])
   ```

## Persons

### Queries Found:
1. `findUnique({ where: { id } })`
   - Current indexes: Primary key
   - Performance: Optimal

2. `findMany()`
   - Current indexes: None specific
   - Recommendation: Add pagination and filtering capabilities

3. `update()`
   - Current indexes: Uses primary key
   - Performance: Optimal

4. `delete()`
   - Current indexes: Uses primary key
   - Performance: Optimal

## Groups

### Queries Found:
1. `findMany()`
   - Current indexes: None specific
   - Recommendation: Add pagination and filtering capabilities

2. `findUnique({ where: { id } })`
   - Current indexes: Primary key
   - Performance: Optimal

3. `create()`
   - Current indexes: Sufficient
   - Performance: Optimal

4. `update()`
   - Current indexes: Uses primary key
   - Performance: Optimal

5. `delete()`
   - Current indexes: Uses primary key
   - Performance: Optimal

## Group Participants

### Queries Found:
1. `findMany({ where: { groupId } })`
   - Current indexes: Composite primary key on `[groupId, participantId]`
   - Performance: Good for lookups by groupId
   - Recommendation: Consider separate index on `groupId` if frequently querying without `participantId`

2. `findUnique()`
   - Current indexes: Uses primary key
   - Performance: Optimal

3. `delete()`
   - Current indexes: Uses primary key
   - Performance: Optimal

## Group Persons

### Queries Found:
1. `create()`
   - Current indexes: Uses composite primary key
   - Performance: Optimal

2. `delete()`
   - Current indexes: Uses primary key
   - Performance: Optimal

3. `findMany({ where: { groupId } })`
   - Current indexes: Has index on `groupId`
   - Performance: Optimal

4. `findUnique()`
   - Current indexes: Uses primary key
   - Performance: Optimal

## Participants

### Queries Found:
1. `findMany()`
   - Current indexes: None specific
   - Recommendation: Add pagination and filtering capabilities

2. `findUnique({ where: { id } })`
   - Current indexes: Primary key
   - Performance: Optimal

3. `create()`
   - Current indexes: Sufficient
   - Performance: Optimal

4. `update()`
   - Current indexes: Uses primary key
   - Performance: Optimal

5. `delete()`
   - Current indexes: Uses primary key
   - Performance: Optimal

## Recommended Schema Changes

Here are all the recommended index additions to optimize query performance:

```prisma
model Conversation {
  // ... existing fields ...
  @@index([participantId])
  @@index([participantId, status])
}

model Message {
  // ... existing fields ...
  @@index([conversationId])
}

model MediaDistribution {
  // ... existing fields ...
  @@index([status]) // For status-based queries
}

model ParticipantPerson {
  // ... existing fields ...
  @@index([participantId])
  @@index([personId])
}
```

## General Recommendations

1. Implement pagination for all `findMany()` queries to prevent performance issues with large datasets
2. Add proper error handling for database constraints
3. Consider adding composite indexes for frequently combined filters
4. Monitor query performance in production to identify additional optimization opportunities 