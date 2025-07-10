# Shula Bot Grafana Dashboards

This document provides detailed information about the Grafana dashboards for monitoring the Shula Bot application, including the specific PromQL queries to use for each dashboard panel.

## Table of Contents

- [General Dashboards](#general-dashboards)
  - [Service Health Overview Dashboard](#service-health-overview-dashboard)
- [Face Recognition Dashboards](#face-recognition-dashboards)
  - [Face Recognition Performance Dashboard](#face-recognition-performance-dashboard)
  - [Face Indexing Dashboard](#face-indexing-dashboard)
  - [User Operations Dashboard](#user-operations-dashboard)
- [Persons Service Dashboards](#persons-service-dashboards)
  - [Persons CRUD Dashboard](#persons-crud-dashboard)
  - [Face Association Dashboard](#face-association-dashboard)
  - [Bulk Operations Dashboard](#bulk-operations-dashboard)
- [Participants Service Dashboards](#participants-service-dashboards)
  - [Participants CRUD Dashboard](#participants-crud-dashboard)
  - [Group Membership Dashboard](#group-membership-dashboard)
  - [Participant Context Dashboard](#participant-context-dashboard)
- [Processor Dashboards](#processor-dashboards)
  - [Face Recognition Job Dashboard](#face-recognition-job-dashboard)
- [Messaging Dashboards](#messaging-dashboards)
  - [Outbound Message Dashboard](#outbound-message-dashboard)
- [Business Alerts](#business-alerts)

## General Dashboards

### Service Health Overview Dashboard

**Purpose**: Provides a high-level view of overall service health across different components of the Shula Bot application.

#### Error Rate by Service

Shows the percentage of operations that result in errors for each service.

**PromQL Queries**:

```promql
# Face Recognition error rate
sum(rate(face_recognition_error_total[5m])) by (service) / sum(rate(face_recognition_attempts_total[5m])) by (service)

# Persons Service error rate
sum(rate(person_creation_error_total[5m] + person_update_error_total[5m] + person_deletion_error_total[5m])) by (service) / sum(rate(person_creation_total[5m] + person_update_total[5m] + person_deletion_total[5m])) by (service)

# Participants Service error rate
sum(rate(participant_query_error_total[5m])) by (service) / sum(rate(participant_query_total[5m])) by (service)

# Outbound Message Service error rate
sum(rate(outbound_message_queue_error_total[5m])) by (service) / sum(rate(outbound_messages_total[5m])) by (service)
```

#### Request Count by Service

Shows the rate of operations performed by each service.

**PromQL Queries**:

```promql
# Face Recognition requests
sum(rate(face_recognition_attempts_total[5m])) by (service)

# Persons Service requests
sum(rate(person_creation_total[5m] + person_update_total[5m] + person_deletion_total[5m] + person_query_total[5m])) by (service)

# Participants Service requests
sum(rate(participant_creation_total[5m] + participant_update_total[5m] + participant_deletion_total[5m] + participant_query_total[5m])) by (service)

# Outbound Message Service requests
sum(rate(outbound_messages_total[5m])) by (service)
```

#### Latency by Service (P95)

Shows the 95th percentile of operation latencies for each service.

**PromQL Queries**:

```promql
# Face Recognition latency
histogram_quantile(0.95, sum(rate(face_recognition_duration_ms_bucket[5m])) by (le, service))

# Person Face Indexing latency
histogram_quantile(0.95, sum(rate(person_face_indexing_duration_ms_bucket[5m])) by (le, service))

# Participant Context Building latency
histogram_quantile(0.95, sum(rate(participant_context_build_duration_ms_bucket[5m])) by (le, service))

# Outbound Message latency
histogram_quantile(0.95, sum(rate(outbound_message_duration_ms_bucket[5m])) by (le, service))
```

## Face Recognition Dashboards

### Face Recognition Performance Dashboard

**Purpose**: Monitors the performance of face recognition operations, providing insights into recognition success rates, latencies, and error patterns.

#### Recognition Attempt Rate

Shows the rate at which face recognition attempts are being made.

**PromQL Query**:

```promql
sum(rate(face_recognition_attempts_total[5m])) by (groupId)
```

#### Recognition Success Rate

Shows the rate of successful face recognition operations.

**PromQL Query**:

```promql
sum(rate(face_recognition_success_total[5m])) by (groupId)
```

#### Recognition Error Rate

Shows the rate of failed face recognition operations.

**PromQL Query**:

```promql
sum(rate(face_recognition_error_total[5m])) by (groupId)
```

#### Recognition Success Percentage

Shows the percentage of face recognition attempts that succeeded.

**PromQL Query**:

```promql
sum(rate(face_recognition_success_total[5m])) by (groupId) / sum(rate(face_recognition_attempts_total[5m])) by (groupId) * 100
```

#### Recognition Duration

Shows the time taken for face recognition operations at different percentiles.

**PromQL Queries**:

```promql
# 50th percentile (median)
histogram_quantile(0.50, sum(rate(face_recognition_duration_ms_bucket[5m])) by (le, groupId))

# 90th percentile
histogram_quantile(0.90, sum(rate(face_recognition_duration_ms_bucket[5m])) by (le, groupId))

# 99th percentile
histogram_quantile(0.99, sum(rate(face_recognition_duration_ms_bucket[5m])) by (le, groupId))
```

#### Faces Recognized Per Image

Shows the average number of faces recognized in each image.

**PromQL Query**:

```promql
sum(rate(recognized_faces_count_sum[5m])) by (groupId) / sum(rate(recognized_faces_count_count[5m])) by (groupId)
```

#### Error Breakdown by Type

Shows the distribution of errors by error type.

**PromQL Query**:

```promql
sum(rate(face_recognition_error_total[5m])) by (errorType, groupId)
```

### Face Indexing Dashboard

**Purpose**: Monitors the performance of face indexing operations, providing insights into indexing success rates, latencies, and error patterns.

#### Indexing Attempt Rate

Shows the rate at which face indexing operations are being attempted.

**PromQL Query**:

```promql
sum(rate(face_indexing_attempts_total[5m])) by (collectionId)
```

#### Indexing Success Rate

Shows the rate of successful face indexing operations.

**PromQL Query**:

```promql
sum(rate(face_indexing_success_total[5m])) by (collectionId)
```

#### Indexing Error Rate

Shows the rate of failed face indexing operations.

**PromQL Query**:

```promql
sum(rate(face_indexing_error_total[5m])) by (collectionId)
```

#### Indexing Duration

Shows the time taken for face indexing operations at different percentiles.

**PromQL Queries**:

```promql
# 50th percentile (median)
histogram_quantile(0.50, sum(rate(face_indexing_duration_ms_bucket[5m])) by (le, collectionId))

# 90th percentile
histogram_quantile(0.90, sum(rate(face_indexing_duration_ms_bucket[5m])) by (le, collectionId))

# 99th percentile
histogram_quantile(0.99, sum(rate(face_indexing_duration_ms_bucket[5m])) by (le, collectionId))
```

#### Faces Indexed Per Operation

Shows the average number of faces indexed in each operation.

**PromQL Query**:

```promql
sum(rate(indexed_faces_count_sum[5m])) by (collectionId) / sum(rate(indexed_faces_count_count[5m])) by (collectionId)
```

#### Error Breakdown by Type

Shows the distribution of indexing errors by error type.

**PromQL Query**:

```promql
sum(rate(face_indexing_error_total[5m])) by (errorType, collectionId)
```

### User Operations Dashboard

**Purpose**: Monitors operations related to users in the face recognition system.

#### User Creation Rate

Shows the rate at which users are being created in the recognition system.

**PromQL Query**:

```promql
sum(rate(rekognition_user_creation_total[5m])) by (collectionId)
```

#### User Deletion Rate

Shows the rate at which users are being deleted from the recognition system.

**PromQL Query**:

```promql
sum(rate(rekognition_user_deletion_total[5m])) by (collectionId)
```

#### Face Deletion Rate

Shows the rate at which faces are being deleted from the recognition system.

**PromQL Query**:

```promql
sum(rate(rekognition_face_deletion_total[5m])) by (collectionId)
```

#### Faces Per User Creation

Shows the average number of faces associated with each user creation.

**PromQL Query**:

```promql
sum(rate(rekognition_user_creation_total[5m] * on(instance) group_right faceCount)) by (collectionId) / sum(rate(rekognition_user_creation_total[5m])) by (collectionId)
```

## Persons Service Dashboards

### Persons CRUD Dashboard

**Purpose**: Monitors the Create, Read, Update, Delete operations for persons in the system.

#### Person Creation Rate

Shows the rate at which persons are being created.

**PromQL Query**:

```promql
sum(rate(person_creation_total[5m])) by (groupId)
```

#### Person Update Rate

Shows the rate at which persons are being updated.

**PromQL Query**:

```promql
sum(rate(person_update_total[5m])) by (groupId)
```

#### Person Deletion Rate

Shows the rate at which persons are being deleted.

**PromQL Query**:

```promql
sum(rate(person_deletion_total[5m])) by (groupId)
```

#### Person Query Rate

Shows the rate at which persons are being queried.

**PromQL Query**:

```promql
sum(rate(person_query_total[5m])) by (queryType)
```

#### Error Rates by Operation Type

Shows the error rates for different types of person operations.

**PromQL Queries**:

```promql
# Creation errors
sum(rate(person_creation_error_total[5m])) by (errorType)

# Update errors
sum(rate(person_update_error_total[5m])) by (errorType)

# Deletion errors
sum(rate(person_deletion_error_total[5m])) by (errorType)
```

#### Error Percentage by Operation Type

Shows the percentage of operations that result in errors for each operation type.

**PromQL Queries**:

```promql
# Creation error percentage
sum(rate(person_creation_error_total[5m])) / sum(rate(person_creation_total[5m])) * 100

# Update error percentage
sum(rate(person_update_error_total[5m])) / sum(rate(person_update_total[5m])) * 100

# Deletion error percentage
sum(rate(person_deletion_error_total[5m])) / sum(rate(person_deletion_total[5m])) * 100
```

### Face Association Dashboard

**Purpose**: Monitors the operations related to associating faces with persons.

#### Face Indexing Operations Rate

Shows the rate at which face indexing operations are being performed.

**PromQL Query**:

```promql
sum(rate(person_face_indexing_total[5m])) by (collectionId)
```

#### Face Indexing Success Rate

Shows the rate of successful face indexing operations.

**PromQL Query**:

```promql
sum(rate(person_face_indexing_success_total[5m])) by (collectionId)
```

#### Face Indexing Error Rate

Shows the rate of failed face indexing operations.

**PromQL Query**:

```promql
sum(rate(person_face_indexing_error_total[5m])) by (collectionId, errorType)
```

#### Face Indexing Duration

Shows the time taken for face indexing operations at different percentiles.

**PromQL Queries**:

```promql
# 50th percentile (median)
histogram_quantile(0.50, sum(rate(person_face_indexing_duration_ms_bucket[5m])) by (le, collectionId))

# 90th percentile
histogram_quantile(0.90, sum(rate(person_face_indexing_duration_ms_bucket[5m])) by (le, collectionId))

# 99th percentile
histogram_quantile(0.99, sum(rate(person_face_indexing_duration_ms_bucket[5m])) by (le, collectionId))
```

#### Faces Per Person

Shows the average number of faces associated with each person.

**PromQL Query**:

```promql
sum(rate(person_face_count_sum[5m])) by (personId) / sum(rate(person_face_count_count[5m])) by (personId)
```

### Bulk Operations Dashboard

**Purpose**: Monitors bulk operations on persons, such as bulk deletions.

#### Bulk Deletion Rate

Shows the rate at which bulk person deletion operations are being performed.

**PromQL Query**:

```promql
sum(rate(person_bulk_deletion_total[5m])) by (groupId)
```

#### Persons Deleted Per Bulk Operation

Shows the average number of persons deleted in each bulk operation.

**PromQL Query**:

```promql
sum(rate(person_bulk_deletion_count_sum[5m])) by (groupId) / sum(rate(person_bulk_deletion_count_count[5m])) by (groupId)
```

#### Total Persons Deleted in Bulk Operations

Shows the total number of persons deleted in bulk operations over a specific time period.

**PromQL Query**:

```promql
sum(increase(person_bulk_deletion_count_sum[1h])) by (groupId)
```

## Participants Service Dashboards

### Participants CRUD Dashboard

**Purpose**: Monitors the Create, Read, Update, Delete operations for participants in the system.

#### Participant Creation Rate

Shows the rate at which participants are being created.

**PromQL Query**:

```promql
rate(participant_creation_total[5m])
```

#### Participant Update Rate

Shows the rate at which participants are being updated.

**PromQL Query**:

```promql
rate(participant_update_total[5m])
```

#### Participant Deletion Rate

Shows the rate at which participants are being deleted.

**PromQL Query**:

```promql
rate(participant_deletion_total[5m])
```

#### Participant Query Rate by Type

Shows the rate at which different types of participant queries are being performed.

**PromQL Query**:

```promql
sum(rate(participant_query_total[5m])) by (queryType)
```

#### Status Update Rate

Shows the rate at which participant statuses are being updated.

**PromQL Query**:

```promql
sum(rate(participant_status_update_total[5m])) by (status)
```

#### Error Rates by Operation Type

Shows the error rates for different types of participant operations.

**PromQL Queries**:

```promql
# Creation errors
rate(participant_creation_error_total[5m])

# Update errors
rate(participant_update_error_total[5m])

# Deletion errors
rate(participant_deletion_error_total[5m])

# Query errors
rate(participant_query_error_total[5m])

# Status update errors
rate(participant_status_update_error_total[5m])
```

### Group Membership Dashboard

**Purpose**: Monitors operations related to participant membership in groups.

#### Group Addition Rate

Shows the rate at which participants are being added to groups.

**PromQL Query**:

```promql
sum(rate(participant_group_add_total[5m])) by (groupId)
```

#### Group Removal Rate

Shows the rate at which participants are being removed from groups.

**PromQL Query**:

```promql
sum(rate(participant_group_remove_total[5m])) by (groupId)
```

#### Participants Per Group

Shows the average number of participants in each group.

**PromQL Query**:

```promql
sum(rate(participants_per_group_sum[5m])) by (groupId) / sum(rate(participants_per_group_count[5m])) by (groupId)
```

#### Group Addition Error Rate

Shows the rate of errors when adding participants to groups.

**PromQL Query**:

```promql
sum(rate(participant_group_add_error_total[5m])) by (groupId, errorType)
```

#### Group Removal Error Rate

Shows the rate of errors when removing participants from groups.

**PromQL Query**:

```promql
sum(rate(participant_group_remove_error_total[5m])) by (groupId, errorType)
```

### Participant Context Dashboard

**Purpose**: Monitors operations related to building and querying participant context.

#### Context Building Operations

Shows the rate at which participant context building operations are being performed.

**PromQL Query**:

```promql
sum(rate(participant_context_build_total[5m]))
```

#### Context Building Duration

Shows the time taken for context building operations at different percentiles.

**PromQL Queries**:

```promql
# 50th percentile (median)
histogram_quantile(0.50, sum(rate(participant_context_build_duration_ms_bucket[5m])) by (le))

# 90th percentile
histogram_quantile(0.90, sum(rate(participant_context_build_duration_ms_bucket[5m])) by (le))

# 99th percentile
histogram_quantile(0.99, sum(rate(participant_context_build_duration_ms_bucket[5m])) by (le))
```

#### Groups Per Participant

Shows the average number of groups associated with each participant.

**PromQL Query**:

```promql
sum(rate(participant_groups_count_sum[5m])) / sum(rate(participant_groups_count_count[5m]))
```

#### Persons Per Participant

Shows the average number of persons associated with each participant.

**PromQL Query**:

```promql
sum(rate(participant_persons_count_sum[5m])) / sum(rate(participant_persons_count_count[5m]))
```

#### Context Building Error Rate

Shows the rate of errors during context building operations.

**PromQL Query**:

```promql
sum(rate(participant_context_build_error_total[5m])) by (errorType)
```

## Processor Dashboards

### Face Recognition Job Dashboard

**Purpose**: Monitors the face recognition job processing operations.

#### Job Processing Rate

Shows the rate at which face recognition jobs are being processed.

**PromQL Query**:

```promql
sum(rate(face_recognition_jobs_total[5m])) by (chatId)
```

#### Job Success Rate

Shows the rate of successful face recognition job processing.

**PromQL Query**:

```promql
sum(rate(face_recognition_jobs_success_total[5m])) by (chatId)
```

#### Job Error Rate

Shows the rate of failed face recognition job processing.

**PromQL Query**:

```promql
sum(rate(face_recognition_jobs_error_total[5m])) by (chatId, errorType)
```

#### Job Processing Duration

Shows the time taken for job processing operations at different percentiles.

**PromQL Queries**:

```promql
# 50th percentile (median)
histogram_quantile(0.50, sum(rate(face_recognition_job_duration_ms_bucket[5m])) by (le, chatId))

# 90th percentile
histogram_quantile(0.90, sum(rate(face_recognition_job_duration_ms_bucket[5m])) by (le, chatId))

# 99th percentile
histogram_quantile(0.99, sum(rate(face_recognition_job_duration_ms_bucket[5m])) by (le, chatId))
```

#### Recognized Persons Per Job

Shows the average number of persons recognized in each job.

**PromQL Query**:

```promql
sum(rate(recognized_persons_per_job_sum[5m])) by (chatId) / sum(rate(recognized_persons_per_job_count[5m])) by (chatId)
```

#### Person Processing Rate

Shows the rate at which individual recognized persons are being processed.

**PromQL Query**:

```promql
sum(rate(recognized_person_processing_total[5m])) by (groupId)
```

#### Person Processing Error Rate

Shows the rate of errors during person processing.

**PromQL Query**:

```promql
sum(rate(recognized_person_processing_error_total[5m])) by (groupId, errorType)
```

#### No Participant Rate

Shows the rate at which recognized persons are not associated with any participant.

**PromQL Query**:

```promql
sum(rate(recognized_person_no_participant_total[5m])) by (groupId)
```

#### Participant Not In Group Rate

Shows the rate at which recognized persons' participants are not in the respective group.

**PromQL Query**:

```promql
sum(rate(recognized_person_participant_not_in_group_total[5m])) by (groupId)
```

#### Notifications Sent Rate

Shows the rate at which notifications are being sent to recognized persons' participants.

**PromQL Query**:

```promql
sum(rate(recognized_person_notification_sent_total[5m])) by (groupId)
```

## Messaging Dashboards

### Outbound Message Dashboard

**Purpose**: Monitors outbound message operations.

#### Total Message Rate

Shows the rate at which outbound messages are being sent.

**PromQL Query**:

```promql
sum(rate(outbound_messages_total[5m]))
```

#### Message Rate by Type

Shows the rate of different types of outbound messages.

**PromQL Queries**:

```promql
# Individual messages
sum(rate(outbound_individual_messages_total[5m]))

# Group messages
sum(rate(outbound_group_messages_total[5m])) by (groupId)

# Poll messages
sum(rate(outbound_polls_total[5m])) by (groupId)
```

#### Media Message Rate

Shows the rate at which media messages are being sent.

**PromQL Query**:

```promql
sum(rate(outbound_media_messages_total[5m])) by (mediaType)
```

#### Message Queue Addition Rate

Shows the rate at which messages are being added to the queue.

**PromQL Query**:

```promql
sum(rate(outbound_message_queue_add_total[5m])) by (jobType, messageType)
```

#### Message Queue Error Rate

Shows the rate of errors when adding messages to the queue.

**PromQL Query**:

```promql
sum(rate(outbound_message_queue_error_total[5m])) by (messageType, errorType)
```

#### Message Processing Duration

Shows the time taken for message processing operations at different percentiles.

**PromQL Queries**:

```promql
# 50th percentile (median)
histogram_quantile(0.50, sum(rate(outbound_message_duration_ms_bucket[5m])) by (le, messageType))

# 90th percentile
histogram_quantile(0.90, sum(rate(outbound_message_duration_ms_bucket[5m])) by (le, messageType))

# 99th percentile
histogram_quantile(0.99, sum(rate(outbound_message_duration_ms_bucket[5m])) by (le, messageType))
```

#### Error Rate Percentage by Message Type

Shows the percentage of messages that result in errors for each message type.

**PromQL Query**:

```promql
sum(rate(outbound_message_queue_error_total[5m])) by (messageType) / sum(rate(outbound_messages_total[5m])) by (messageType) * 100
```

## Business Alerts

**Purpose**: Configures alerts for critical business conditions.

### High Error Rate Alert

Triggers when the error rate for a service exceeds a threshold.

**PromQL Queries**:

```promql
# Face Recognition high error rate
sum(rate(face_recognition_error_total[5m])) / sum(rate(face_recognition_attempts_total[5m])) > 0.1

# Persons Service high error rate
sum(rate(person_creation_error_total[5m] + person_update_error_total[5m] + person_deletion_error_total[5m])) / sum(rate(person_creation_total[5m] + person_update_total[5m] + person_deletion_total[5m])) > 0.1

# Participants Service high error rate
sum(rate(participant_query_error_total[5m])) / sum(rate(participant_query_total[5m])) > 0.1

# Outbound Message Service high error rate
sum(rate(outbound_message_queue_error_total[5m])) / sum(rate(outbound_messages_total[5m])) > 0.1
```

### Slow Response Time Alert

Triggers when the response time for a service exceeds a threshold.

**PromQL Queries**:

```promql
# Face Recognition slow response time
histogram_quantile(0.95, sum(rate(face_recognition_duration_ms_bucket[5m]))) > 5000

# Person Face Indexing slow response time
histogram_quantile(0.95, sum(rate(person_face_indexing_duration_ms_bucket[5m]))) > 5000

# Participant Context Building slow response time
histogram_quantile(0.95, sum(rate(participant_context_build_duration_ms_bucket[5m]))) > 1000

# Outbound Message slow response time
histogram_quantile(0.95, sum(rate(outbound_message_duration_ms_bucket[5m]))) > 1000
```

### Abnormal Message Volume Alert

Triggers when the message volume is abnormally high or shows a significant change.

**PromQL Queries**:

```promql
# High message volume
sum(rate(outbound_messages_total[5m])) > 100

# Significant change in message volume
abs(sum(rate(outbound_messages_total[5m])) - sum(rate(outbound_messages_total[5m] offset 1d))) / sum(rate(outbound_messages_total[5m] offset 1d)) > 0.5
```

### Face Recognition Service Degradation Alert

Triggers when the face recognition service shows signs of degradation.

**PromQL Queries**:

```promql
# Low success rate
sum(rate(face_recognition_success_total[5m])) / sum(rate(face_recognition_attempts_total[5m])) < 0.8

# Very slow response time
histogram_quantile(0.95, sum(rate(face_recognition_duration_ms_bucket[5m]))) > 10000
```

## Implementation Notes

1. These dashboards and alerts should be adjusted based on your specific business needs and traffic patterns.
2. The time window (`[5m]`) can be adjusted based on your monitoring requirements.
3. Threshold values for alerts should be calibrated based on your application's normal behavior.
4. Consider adding more specialized dashboards as you identify specific business metrics to track.
5. For each dashboard, consider adding summary panels showing:
   - Total success/error counts
   - Recognition rates
   - Peak traffic times
   - Business KPIs such as user engagement metrics

## Next Steps

1. Import these dashboards into your Grafana instance
2. Configure the alerts with appropriate notification channels
3. Review and adjust thresholds based on observed behavior
4. Consider adding more specialized dashboards for specific business metrics related to user engagement and system effectiveness 