import { gql } from "@apollo/client/core";

export const CREATE_USER = gql`
  mutation CreateUser(
    $id: uuid!
    $email: String!
    $password: String!
    $role: user_role!
    $departmentId: uuid!
    $name: String!
    $phone: String
  ) {
    insert_users_one(
      object: {
        id: $id
        email: $email
        password_hash: $password
        role: $role
        department_id: $departmentId
      }
    ) {
      id
      email
      password_hash
      role
      department_id
    }
    insert_profiles_one(
      object: {
        user_id: $id
        name: $name
        phone: $phone
      }
    ) {
      user_id
      name
      phone
    }
  }
`;

export const CREATE_MENTOR_AND_USER = gql`
  mutation CreateMentorAndUser(
    $id: uuid!
    $name: String!
    $email: String!
    $password: String!
    $role: user_role!
    $departmentId: uuid!
    $phone: String
  ) {
    insert_users_one(
      object: {
        id: $id
        email: $email
        password_hash: $password
        role: $role
        department_id: $departmentId
      }
    ) {
      id
      email
      role
      department_id
    }
    insert_profiles_one(
      object: {
        user_id: $id
        name: $name
        phone: $phone
      }
    ) {
      user_id
      name
      phone
    }
  }
`;

export const CREATE_INTERN_AND_USER = gql`
  mutation CreateInternAndUser(
    $id: uuid!
    $name: String!
    $email: String!
    $password: String!
    $role: user_role!
    $departmentId: uuid!
    $phone: String
    $mentorId: uuid!
    $startDate: date
    $internStatus: intern_status!
    $collegeName: String
    $university: String
    $graduationDegree: String
    $createdByAdmin: uuid!
  ) {
    insert_users_one(
      object: {
        id: $id
        email: $email
        password_hash: $password
        role: $role
        department_id: $departmentId
      }
    ) {
      id
    }
    insert_profiles_one(
      object: {
        user_id: $id
        name: $name
        phone: $phone
      }
    ) {
      user_id
      name
      phone
    }
    insert_interns_one(
      object: {
        user_id: $id
        mentor_id: $mentorId
        created_by_admin: $createdByAdmin
        start_date: $startDate
        status: $internStatus
        college_name: $collegeName
        university: $university
        graduation_degree: $graduationDegree
      }
    ) {
      user_id
      mentor_id
      created_by_admin
      start_date
      end_date
      status
      college_name
      university
      graduation_degree
      profile_verified
      profile_verified_by
      profile_verified_at
    }
  }
`;

export const UPDATE_INTERN_AND_USER = gql`
  mutation UpdateInternAndUser(
    $id: uuid!
    $name: String!
    $email: String!
    $departmentId: uuid
    $phone: String
    $mentorId: uuid
    $createdByAdmin: uuid
    $startDate: date
    $endDate: date
    $status: intern_status
    $collegeName: String
    $university: String
    $graduationDegree: String
    $profileVerified: Boolean
    $profileVerifiedBy: uuid
    $profileVerifiedAt: timestamptz
  ) {
    update_users_by_pk(
      pk_columns: { id: $id }
      _set: {
        email: $email
        department_id: $departmentId
      }
    ) {
      id
    }
    update_profiles_by_pk(
      pk_columns: { user_id: $id }
      _set: {
        name: $name
        phone: $phone
      }
    ) {
      user_id
    }
    update_interns_by_pk(
      pk_columns: { user_id: $id }
      _set: {
        mentor_id: $mentorId
        created_by_admin: $createdByAdmin
        start_date: $startDate
        end_date: $endDate
        status: $status
        college_name: $collegeName
        university: $university
        graduation_degree: $graduationDegree
        profile_verified: $profileVerified
        profile_verified_by: $profileVerifiedBy
        profile_verified_at: $profileVerifiedAt
      }
    ) {
      user_id
    }
  }
`;

export const UPDATE_INTERN_PROFILE_FIELDS = gql`
  mutation UpdateInternProfileFields(
    $id: uuid!
    $phone: String
    $collegeName: String
    $university: String
    $graduationDegree: String
    $endDate: date
    $profileVerified: Boolean
  ) {
    update_profiles_by_pk(
      pk_columns: { user_id: $id }
      _set: { phone: $phone }
    ) {
      user_id
    }
    update_interns_by_pk(
      pk_columns: { user_id: $id }
      _set: {
        college_name: $collegeName
        university: $university
        graduation_degree: $graduationDegree
        end_date: $endDate
        profile_verified: $profileVerified
        profile_verified_by: null
        profile_verified_at: null
      }
    ) {
      user_id
    }
  }
`;

export const VERIFY_INTERN_PROFILE = gql`
  mutation VerifyInternProfile($id: uuid!, $verifiedBy: uuid!, $verifiedAt: timestamptz!) {
    update_interns_by_pk(
      pk_columns: { user_id: $id }
      _set: {
        profile_verified: true
        profile_verified_by: $verifiedBy
        profile_verified_at: $verifiedAt
      }
    ) {
      user_id
      profile_verified
      profile_verified_by
      profile_verified_at
    }
  }
`;

export const DELETE_INTERN_AND_USER = gql`
  mutation DeleteInternAndUser($id: uuid!) {
    delete_interns_by_pk(user_id: $id) {
      user_id
    }
    delete_profiles_by_pk(user_id: $id) {
      user_id
    }
    delete_users_by_pk(id: $id) {
      id
    }
  }
`;

export const CREATE_TASK = gql`
  mutation CreateTask(
    $id: uuid!
    $title: String!
    $description: String
    $assignedBy: uuid!
    $assignedToAll: Boolean!
    $deadline: date
    $priority: task_priority!
  ) {
    insert_tasks_one(
      object: {
        id: $id
        title: $title
        description: $description
        assigned_by: $assignedBy
        assigned_to_all: $assignedToAll
        deadline: $deadline
        priority: $priority
      }
    ) {
      id
      title
      description
      assigned_by
      assigned_to_all
      deadline
      priority
      created_at
    }
  }
`;

export const UPDATE_TASK_ASSIGNMENT_STATUS = gql`
  mutation UpdateTaskAssignmentStatus($taskId: uuid!, $internId: uuid!, $status: task_status!) {
    update_task_assignments_by_pk(
      pk_columns: { task_id: $taskId, intern_id: $internId }
      _set: { status: $status }
    ) {
      task_id
      intern_id
      status
    }
  }
`;

export const UPDATE_TASK_STATUS = UPDATE_TASK_ASSIGNMENT_STATUS;


export const UPDATE_TASK_BY_CREATOR = gql`
  mutation UpdateTaskByCreator(
    $id: uuid!
    $title: String
    $description: String
    $deadline: date
    $priority: task_priority
    $assignedToAll: Boolean
  ) {
    update_tasks_by_pk(
      pk_columns: { id: $id }
      _set: {
        title: $title
        description: $description
        deadline: $deadline
        priority: $priority
        assigned_to_all: $assignedToAll
      }
    ) {
      id
    }
  }
`;

export const UPDATE_TASK_STATUS_BULK = gql`
  mutation UpdateTaskStatusBulk($taskId: uuid!, $status: task_status!) {
    update_task_assignments(
      where: { task_id: { _eq: $taskId } },
      _set: { status: $status }
    ) {
      affected_rows
    }
  }
`;

export const REPLACE_TASK_ASSIGNMENTS = gql`
  mutation ReplaceTaskAssignments($taskId: uuid!) {
    delete_task_assignments(where: { task_id: { _eq: $taskId } }) {
      affected_rows
    }
  }
`;

export const INSERT_TASK_ASSIGNMENTS = gql`
  mutation InsertTaskAssignments($objects: [task_assignments_insert_input!]!) {
    insert_task_assignments(objects: $objects) {
      affected_rows
    }
  }
`;

export const DELETE_TASK = gql`
  mutation DeleteTask($id: uuid!) {
    delete_tasks_by_pk(id: $id) {
      id
    }
  }
`;

export const CREATE_REPORT = gql`
  mutation CreateReport(
    $id: uuid!
    $internId: uuid!
    $reportDate: date!
    $workDescription: String!
    $hoursWorked: numeric!
  ) {
    insert_reports_one(
      object: {
        id: $id
        intern_id: $internId
        report_date: $reportDate
        work_description: $workDescription
        hours_worked: $hoursWorked
      }
    ) {
      id
      intern_id
      report_date
      work_description
      hours_worked
      mentor_feedback
      submitted_at
    }
  }
`;

export const UPDATE_REPORT = gql`
  mutation UpdateReport(
    $id: uuid!
    $reportDate: date
    $workDescription: String
    $hoursWorked: numeric
    $mentorFeedback: String
  ) {
    update_reports_by_pk(
      pk_columns: { id: $id }
      _set: {
        report_date: $reportDate
        work_description: $workDescription
        hours_worked: $hoursWorked
        mentor_feedback: $mentorFeedback
      }
    ) {
      id
      intern_id
      report_date
      work_description
      hours_worked
      mentor_feedback
      submitted_at
    }
  }
`;

export const UPDATE_MENTOR_USER = gql`
  mutation UpdateMentorUser(
    $id: uuid!
    $name: String!
    $email: String!
    $departmentId: uuid
    $phone: String
  ) {
    update_users_by_pk(
      pk_columns: { id: $id }
      _set: {
        email: $email
        department_id: $departmentId
      }
    ) {
      id
      email
      role
      department_id
    }
    update_profiles_by_pk(
      pk_columns: { user_id: $id }
      _set: {
        name: $name
        phone: $phone
      }
    ) {
      user_id
      name
      phone
    }
  }
`;

export const DELETE_MENTOR_USER = gql`
  mutation DeleteMentorUser($id: uuid!) {
    delete_profiles_by_pk(user_id: $id) {
      user_id
      name
    }
    delete_users_by_pk(id: $id) {
      id
      email
      role
    }
  }
`;

export const CREATE_PASSWORD_RESET_TOKEN = gql`
  mutation CreatePasswordResetToken(
    $id: uuid!
    $email: String!
    $token: String
    $otp_code: String
    $type: String!
    $expires_at: timestamptz!
    $attempts: Int
  ) {
    insert_password_reset_tokens_one(
      object: {
        id: $id
        email: $email
        token: $token
        otp_code: $otp_code
        type: $type
        expires_at: $expires_at
        attempts: $attempts
      }
    ) {
      id
      email
      token
      otp_code
      type
      expires_at
      attempts
      created_at
    }
  }
`;

export const UPDATE_PASSWORD_RESET_TOKEN = gql`
  mutation UpdatePasswordResetToken(
    $id: uuid!
    $attempts: Int
    $used_at: timestamptz
  ) {
    update_password_reset_tokens_by_pk(
      pk_columns: { id: $id }
      _set: {
        attempts: $attempts
        used_at: $used_at
      }
    ) {
      id
      email
      attempts
      used_at
    }
  }
`;

export const DELETE_PASSWORD_RESET_TOKEN = gql`
  mutation DeletePasswordResetToken($id: uuid!) {
    delete_password_reset_tokens_by_pk(id: $id) {
      id
    }
  }
`;

export const DELETE_EXPIRED_TOKENS = gql`
  mutation DeleteExpiredTokens($now: timestamptz!) {
    delete_password_reset_tokens(where: { expires_at: { _lt: $now } }) {
      affected_rows
    }
  }
`;

export const UPDATE_USER_PASSWORD = gql`
  mutation UpdateUserPassword($id: uuid!, $passwordHash: String!) {
    update_users_by_pk(
      pk_columns: { id: $id }
      _set: { password_hash: $passwordHash }
    ) {
      id
      email
    }
  }
`;

export const UPDATE_USER_EMAIL = gql`
  mutation UpdateUserEmail($id: uuid!, $email: String!) {
    update_users_by_pk(
      pk_columns: { id: $id }
      _set: { email: $email }
    ) {
      id
      email
    }
  }
`;

export const INSERT_ATTENDANCE = gql`
  mutation InsertAttendance(
    $userId: uuid!
    $date: date!
    $clockIn: timestamptz!
    $status: String!
  ) {
    insert_attendance_one(
      object: {
        user_id: $userId
        date: $date
        clock_in: $clockIn
        status: $status
      }
    ) {
      id
      clock_in
    }
  }
`;

export const UPDATE_ATTENDANCE = gql`
  mutation UpdateAttendance(
    $id: uuid!
    $clockOut: timestamptz!
    $totalHours: numeric!
  ) {
    update_attendance_by_pk(
      pk_columns: { id: $id }
      _set: { clock_out: $clockOut, total_hours: $totalHours }
    ) {
      id
      clock_out
      total_hours
    }
  }
`;

export const LOG_ACTIVITY = gql`
  mutation LogActivity(
    $userId: uuid!
    $action: String!
    $entityType: String!
    $entityId: uuid
    $metadata: jsonb
  ) {
    insert_activity_logs_one(
      object: {
        user_id: $userId
        action: $action
        entity_type: $entityType
        entity_id: $entityId
        metadata: $metadata
      }
    ) {
      id
      created_at
    }
  }
`;

export const INSERT_USERS_BULK = gql`
  mutation InsertUsersBulk($users: [users_insert_input!]!) {
    insert_users(objects: $users) {
      returning {
        id
        email
      }
    }
  }
`;

export const CREATE_EVENT = gql`
  mutation CreateEvent(
    $id: uuid!
    $title: String!
    $description: String
    $startTime: timestamptz!
    $endTime: timestamptz!
    $location: String
    $departmentId: uuid
    $createdBy: uuid!
  ) {
    insert_events_one(
      object: {
        id: $id
        title: $title
        description: $description
        start_time: $startTime
        end_time: $endTime
        location: $location
        department_id: $departmentId
        created_by: $createdBy
      }
    ) {
      id
      title
      start_time
    }
  }
`;

export const DELETE_EVENT = gql`
  mutation DeleteEvent($id: uuid!) {
    delete_events_by_pk(id: $id) {
      id
    }
  }
`;

export const CREATE_DEPARTMENT = gql`
  mutation CreateDepartment($id: uuid!, $name: String!) {
    insert_departments_one(object: { id: $id, name: $name }) {
      id
      name
      head_id
      head: user {
        id
        profile {
          name
        }
      }
    }
  }
`;

export const UPDATE_DEPARTMENT = gql`
  mutation UpdateDepartment($id: uuid!, $name: String, $headId: uuid) {
    update_departments_by_pk(
      pk_columns: { id: $id }
      _set: { name: $name, head_id: $headId }
    ) {
      id
      name
      head_id
      head: user {
        id
        profile {
          name
        }
      }
    }
  }
`;

export const UPDATE_DEPARTMENT_NAME = gql`
  mutation UpdateDepartmentName($id: uuid!, $name: String!) {
    update_departments_by_pk(
      pk_columns: { id: $id }
      _set: { name: $name }
    ) {
      id
      name
      head_id
      head: user {
        id
        profile {
          name
        }
      }
    }
  }
`;

export const UPDATE_DEPARTMENT_HEAD = gql`
  mutation UpdateDepartmentHead($id: uuid!, $headId: uuid) {
    update_departments_by_pk(
      pk_columns: { id: $id }
      _set: { head_id: $headId }
    ) {
      id
      name
      head_id
      head: user {
        id
        profile {
          name
        }
      }
    }
  }
`;

export const DELETE_DEPARTMENT = gql`
  mutation DeleteDepartment($id: uuid!) {
    delete_departments_by_pk(id: $id) {
      id
      name
    }
  }
`;

