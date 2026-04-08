import { gql } from "@apollo/client/core";

export const GET_USER_BY_ID = gql`
  query GetUserById($id: uuid!) {
    users_by_pk(id: $id) {
      id
      email
      password_hash
      role
      department_id
      department {
        id
        name
      }
      profile {
        name
        phone
      }
    }
  }
`;

export const GET_USER_BY_EMAIL = gql`
  query GetUserByEmail($email: String!) {
    users(where: { email: { _eq: $email } }, limit: 1) {
      id
      email
      password_hash
      role
      department_id
      department {
        id
        name
      }
      profile {
        name
        phone
      }
    }
  }
`;

export const GET_INTERN_BY_ID = gql`
  query GetInternById($id: uuid!) {
    users_by_pk(id: $id) {
      id
      email
      role
      department_id
      department {
        id
        name
      }
      profile {
        name
        phone
      }
      intern {
        mentor_id
        created_by_admin
        start_date
        end_date
        status
        college_name
        university
      }
    }
  }
`;

export const GET_TASK_BY_ID = gql`
  query GetTaskById($id: uuid!) {
    tasks_by_pk(id: $id) {
      id
      title
      description
      assigned_by
      assigned_to_all
      deadline
      priority
      created_at
      task_assignments {
        intern_id
        status
      }
    }
  }
`;

export const GET_TASK_ASSIGNMENTS_BY_TASK_ID = gql`
  query GetTaskAssignmentsByTaskId($taskId: uuid!) {
    task_assignments(where: { task_id: { _eq: $taskId } }) {
      intern_id
      status
    }
  }
`;

export const GET_TASK_ASSIGNMENTS_BY_TASK_IDS = gql`
  query GetTaskAssignmentsByTaskIds($taskIds: [uuid!]!) {
    task_assignments(where: { task_id: { _in: $taskIds } }) {
      task_id
      intern_id
      status
    }
  }
`;

export const GET_TASK_IDS_FOR_INTERN = gql`
  query GetTaskIdsForIntern($internId: uuid!) {
    task_assignments(where: { intern_id: { _eq: $internId } }) {
      task_id
      status
    }
  }
`;

export const GET_USERS = gql`
  query GetUsers {
    users(order_by: { created_at: desc }) {
      id
      email
      password_hash
      role
      department_id
      department {
        id
        name
      }
      profile {
        name
        phone
      }
    }
  }
`;

export const  EXISTING_USER_BY_EMAIL = gql`
  query ExistingUserByEmail($email: String!) {
    users(where: { email: { _eq: $email } }, limit: 1) {
      id
    }
  }
`;

export const EXISTING_USER_BY_ID = gql`
  query ExistingUserById($id: uuid!) {
    users_by_pk(id: $id) {
      id
    }
  }
`;

export const GET_ALL_INTERNS = gql`
  query GetAllInterns($limit: Int, $offset: Int, $order_by: [users_order_by!], $where: users_bool_exp) {
    items: users(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {
      id
      email
      role
      department_id
      department {
        id
        name
      }
      profile {
        name
        phone
      }
      intern {
        mentor_id
        created_by_admin
        start_date
        end_date
        status
        college_name
        university
      }
    }
    meta: users_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`;

export const GET_MENTOR_INTERNS = gql`
  query GetMentorInterns($limit: Int, $offset: Int, $order_by: [users_order_by!], $where: users_bool_exp) {
    items: users(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {
      id
      email
      role
      department_id
      department {
        id
        name
      }
      profile {
        name
        phone
      }
      intern {
        mentor_id
        created_by_admin
        start_date
        end_date
        status
        college_name
        university
      }
    }
    meta: users_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`;

export const GET_INTERN_PROFILE = gql`
  query GetInternProfile($id: uuid!) {
    users(where: { id: { _eq: $id }, role: { _eq: "intern" } }, limit: 1) {
      id
      email
      role
      department_id
      department {
        id
        name
      }
      profile {
        name
        phone
      }
      intern {
        mentor_id
        created_by_admin
        start_date
        end_date
        status
        college_name
        university
      }
    }
  }
`;

export const GET_CREATOR_TASKS = gql`
  query GetCreatorTasks($limit: Int, $offset: Int, $order_by: [tasks_order_by!], $where: tasks_bool_exp) {
    items: tasks(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {
      id
      title
      description
      assigned_by
      assigned_to_all
      deadline
      priority
      created_at
      task_assignments {
        intern_id
        status
      }
    }
    meta: tasks_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`;

export const GET_ALL_TASKS = gql`
  query GetAllTasks($limit: Int, $offset: Int, $order_by: [tasks_order_by!], $where: tasks_bool_exp) {
    items: tasks(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {
      id
      title
      description
      assigned_by
      assigned_to_all
      deadline
      priority
      created_at
      task_assignments {
        intern_id
        status
      }
    }
    meta: tasks_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`;

export const GET_INTERN_TASKS = gql`
  query GetInternTasks($limit: Int, $offset: Int, $order_by: [tasks_order_by!], $where: tasks_bool_exp) {
    items: tasks(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {
      id
      title
      description
      assigned_by
      assigned_to_all
      deadline
      priority
      created_at
      task_assignments {
        intern_id
        status
      }
    }
    meta: tasks_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`;

export const GET_ALL_INTERN_IDS = gql`
  query GetAllInternIds {
    users(where: { role: { _eq: "intern" } }) {
      id
    }
  }
`;

export const GET_ALL_REPORTS = gql`
  query GetAllReports($limit: Int, $offset: Int, $order_by: [reports_order_by!], $where: reports_bool_exp) {
    items: reports(where: $where, order_by: $order_by, limit: $limit, offset: $offset) {
      id
      intern_id
      report_date
      work_description
      hours_worked
      mentor_feedback
      submitted_at
    }
    meta: reports_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`;

export const GET_MENTOR_INTERN_IDS = gql`
  query GetMentorInternIds($mentorId: uuid!) {
    users(where: { role: { _eq: "intern" }, intern: { mentor_id: { _eq: $mentorId } } }) {
      id
    }
  }
`;

export const GET_MENTOR_REPORTS = gql`
  query GetMentorReports($internIds: [uuid!]!) {
    reports(
      where: { intern_id: { _in: $internIds } }
      order_by: { submitted_at: desc }
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

export const GET_INTERN_REPORTS = gql`
  query GetInternReports($internId: uuid!) {
    reports(where: { intern_id: { _eq: $internId } }, order_by: { submitted_at: desc }) {
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

export const GET_REPORT_BY_ID = gql`
  query GetReportById($id: uuid!) {
    reports_by_pk(id: $id) {
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

export const GET_MENTOR_BY_ID = gql`
  query GetMentorById($id: uuid!) {
    users_by_pk(id: $id) {
      id
      email
      role
      department_id
      department {
        id
        name
      }
      profile {
        name
      }
    }
  }
`;

export const GET_PASSWORD_RESET_TOKEN = gql`
  query GetPasswordResetToken($token: String!, $type: String!) {
    password_reset_tokens(
      where: {
        token: { _eq: $token }
        type: { _eq: $type }
        expires_at: { _gt: "now()" }
        used_at: { _is_null: true }
      }
      limit: 1
    ) {
      id
      email
      token
      type
      expires_at
      attempts
      created_at
    }
  }
`;

export const GET_OTP_CODE = gql`
  query GetOtpCode($email: String!, $otp_code: String!) {
    password_reset_tokens(
      where: {
        email: { _eq: $email }
        otp_code: { _eq: $otp_code }
        type: { _eq: "otp" }
        expires_at: { _gt: "now()" }
        used_at: { _is_null: true }
      }
      limit: 1
    ) {
      id
      email
      otp_code
      expires_at
      attempts
      created_at
    }
  }
`;

export const GET_RECENT_OTP_ATTEMPTS = gql`
  query GetRecentOtpAttempts($email: String!, $since: timestamptz!) {
    password_reset_tokens(
      where: {
        email: { _eq: $email }
        type: { _eq: "otp" }
        created_at: { _gte: $since }
      }
    ) {
      id
      created_at
    }
  }
`;

export const GET_INTERNS_WITHOUT_REPORT = gql`
  query GetInternsWithoutReport($date: date!) {
    users(
      where: {
        role: { _eq: "intern" }
        intern: { status: { _eq: "active" } }
        _not: { reports: { report_date: { _eq: $date } } }
      }
    ) {
      id
      email
      profile {
        name
      }
    }
  }
`;
export const GET_ADMIN_STATS = gql`
  query GetAdminStats {
    users_aggregate(where: {role: {_eq: intern}}) {
      aggregate {
        count
      }
    }
    mentors: users_aggregate(where: {role: {_eq: mentor}}) {
      aggregate {
        count
      }
    }
    tasks_aggregate {
      aggregate {
        count
      }
    }
  }
`;

export const GET_TASK_STATUS_STATS = gql`
  query GetTaskStatusStats {
    task_assignments {
      status
    }
  }
`;

export const GET_DAILY_HOURS_STATS = gql`
  query GetDailyHoursStats($startDate: date!) {
    reports(where: {report_date: {_gte: $startDate}}, order_by: {report_date: asc}) {
      report_date
      hours_worked
    }
  }
`;

export const GLOBAL_SEARCH = gql`
  query GlobalSearch($query: String!) {
    interns: users(where: {
      _and: [
        {role: {_eq: "intern"}},
        {_or: [
          {profile: {name: {_ilike: $query}}},
          {email: {_ilike: $query}}
        ]}
      ]
    }, limit: 5) {
      id
      email
      profile { name }
    }
    mentors: users(where: {
      _and: [
        {role: {_eq: "mentor"}},
        {_or: [
          {profile: {name: {_ilike: $query}}},
          {email: {_ilike: $query}}
        ]}
      ]
    }, limit: 5) {
      id
      email
      profile { name }
    }
    tasks(where: {
      _or: [
        {title: {_ilike: $query}},
        {description: {_ilike: $query}}
      ]
    }, limit: 5) {
      id
      title
      task_assignments {
        status
      }
    }
  }
`;

export const GET_USER_ATTENDANCE = gql`
  query GetUserAttendance($userId: uuid!, $date: date!) {
    attendance(where: { user_id: { _eq: $userId }, date: { _eq: $date } }) {
      id
      user_id
      date
      clock_in
      clock_out
      status
      total_hours
    }
  }
`;

export const GET_ALL_ATTENDANCE = gql`
  query GetAllAttendance($date: date!) {
    attendance(where: { date: { _eq: $date } }, order_by: { clock_in: desc }) {
      id
      user_id
      date
      clock_in
      clock_out
      status
      total_hours
      user {
        profile {
          name
        }
      }
    }
  }
`;

export const GET_ACTIVITY_LOGS = gql`
  query GetActivityLogs($limit: Int = 20) {
    activity_logs(order_by: { created_at: desc }, limit: $limit) {
      id
      user_id
      action
      entity_type
      entity_id
      metadata
      created_at
      user {
        profile {
          name
        }
      }
    }
  }
`;

export const GET_ACTIVITY_LOGS_BY_DEPT = gql`
  query GetActivityLogsByDept($limit: Int!, $departmentId: uuid!) {
    activity_logs(
      where: { user: { department_id: { _eq: $departmentId } } }
      order_by: { created_at: desc }
      limit: $limit
    ) {
      id
      user_id
      action
      entity_type
      entity_id
      metadata
      created_at
      user {
        profile {
          name
        }
      }
    }
  }
`;

export const GET_EVENTS = gql`
  query GetEvents($where: events_bool_exp) {
    events(where: $where, order_by: { start_time: asc }) {
      id
      title
      description
      start_time
      end_time
      location
      department_id
      department {
        id
        name
      }
      created_by
      created_at
      creator: user {
        profile {
          name
        }
      }
    }
  }
`;

export const GET_DEPARTMENTS = gql`
  query GetDepartments {
    departments(order_by: { name: asc }) {
      id
      name
      head_id
    }
  }
`;

export const GET_DEPARTMENT_BY_NAME = gql`
  query GetDepartmentByName($name: String!) {
    departments(where: { name: { _eq: $name } }, limit: 1) {
      id
      name
    }
  }
`;

