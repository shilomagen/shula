# Event Reference

This document lists the core event types and queue names used for communication between the WhatsApp container and the backend service. These types are defined in the **shared-queues** package and are used across the platform.

## Group Events

| Enum Value | Description |
|------------|-------------|
| `GROUP_JOINED` | Bot or participants joined a WhatsApp group |
| `GROUP_LEFT` | Bot or participants left a group |
| `GROUP_ADMIN_CHANGED` | A participant gained or lost admin rights |
| `GROUP_PARTICIPANTS_SYNC` | Full participants list sync |

## Message Events

| Enum Value | Description |
|------------|-------------|
| `MESSAGE_RECEIVED` | A message was received from a participant |
| `MESSAGE_SENT` | A message was sent by the bot |
| `MESSAGE_STATUS_CHANGED` | Delivery status updated |

## Poll Events

| Enum Value | Description |
|------------|-------------|
| `POLL_VOTE_UPDATE` | A user voted on a poll |

## Message Reaction Events

| Enum Value | Description |
|------------|-------------|
| `MESSAGE_REACTION_ADDED` | A reaction emoji was added to a message |
| `MESSAGE_REACTION_REMOVED` | A reaction was removed from a message |

## Queue Names

| Constant | Purpose |
|----------|---------|
| `whatsapp-group-management` | Handles group join/leave/admin events |
| `whatsapp-message-processing` | Processes inbound messages |
| `whatsapp-outbound-message` | Sends outbound messages |
| `persons` | Person management tasks |
| `whatsapp-status` | WhatsApp connection status updates |
| `whatsapp-poll-events` | Poll vote updates |
| `whatsapp-message-reactions` | Reaction add/remove events |

These shared event definitions allow all services to exchange structured payloads via BullMQ queues. The `WithContext` decorator from the same package ensures each BullMQ job runs with a correlation ID for consistent logging and tracing.
