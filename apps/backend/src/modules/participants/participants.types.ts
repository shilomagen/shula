/**
 * Context for a participant
 */
export interface ParticipantContext {
  /**
   * The participant's name
   */
  readonly name: string;

  /**
   * Groups the participant belongs to
   */
  readonly groups: EnhancedGroupInfo[];
}

/**
 * Enhanced information about a group with related persons
 */
export interface EnhancedGroupInfo {
  /**
   * The group ID
   */
  readonly id: string;

  /**
   * The group name
   */
  readonly name: string;

  /**
   * Persons related to this group
   */
  readonly persons: GroupPersonInfo[];
}

/**
 * Information about a person in a group
 */
export interface GroupPersonInfo {
  /**
   * The person ID
   */
  readonly id: string;

  /**
   * The person's name
   */
  readonly name: string;
}
