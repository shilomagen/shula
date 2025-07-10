# Participant ID Filtering

This document explains how to retrieve groups, conversations, and persons filtered by a specific participant ID using the backend API.

## API Endpoints with Operation IDs

### Groups by Participant ID

There are two ways to filter groups by participant ID:

1. **getAllGroupsWithCounts**:
   ```
   GET /v1/groups/with-counts?participantId={participantId}
   ```

2. **queryGroups**:
   ```
   POST /v1/groups/query
   ```
   Request Body:
   ```json
   {
     "participantId": "uuid-of-participant",
     "page": 1,
     "size": 10
   }
   ```

### Conversations by Participant ID

1. **getAllConversations**:
   ```
   GET /v1/conversations?participantId={participantId}
   ```

2. **getConversationsByParticipantId**:
   ```
   GET /v1/conversations/participant/{participantId}
   ```

### Persons by Participant ID

1. **getAllPersons**:
   ```
   GET /v1/persons?participantId={participantId}
   ```

2. **getPersonsByParticipant**:
   ```
   GET /v1/persons/by-participant/{participantId}
   ```

## Server Actions Implementation

We've implemented the following server actions for accessing the API:

```tsx
// For groups
getGroupsByParticipantId(participantId: string, page = 1, size = 10)

// For conversations
getConversationsByParticipantId(participantId: string)

// For persons
getPersonsByParticipant(xParticipantId: string, participantId: string)
```

## Hooks Implementation

The following custom hooks are available to simplify data fetching in client components:

```tsx
// For groups
useGroupsByParticipant(participantId: string, page = 1, size = 10)

// For conversations
useConversationsByParticipant(participantId: string)

// For persons
usePersonsByParticipant(participantId: string, xParticipantId: string)
```

## Usage in Components

We've updated all participant detail sections to use direct API calls instead of participantContext:

1. Updated `ParticipantGroupsSection` to use `useGroupsByParticipant`
2. Updated `ParticipantConversationsSection` to use `useConversationsByParticipant`
3. Updated `ParticipantPersonsSection` to use `usePersonsByParticipant`

Example usage in a component:

```tsx
const ParticipantGroupsSection = ({ participantId }) => {
  // Get the participant ID from props or URL params
  const params = useParams();
  const id = participantId || (params?.id as string);
  
  // Fetch groups for this participant
  const { data, isLoading } = useGroupsByParticipant(id);
  const groups = data?.items || [];
  
  // Render with loading states and data
  return isLoading ? <Loading /> : <GroupsTable groups={groups} />;
};
```

These API methods and hooks make it easy to retrieve all related data for a specific participant in the admin dashboard while ensuring proper separation between data fetching and UI components.

## Completed Tasks

- [x] Created server actions for direct API access
- [x] Implemented custom React hooks with React Query
- [x] Updated UI components to use direct API calls
- [x] Added proper loading states
- [x] Fixed component props to accept participant ID instead of context
- [x] Ensured all TypeScript types are correct 