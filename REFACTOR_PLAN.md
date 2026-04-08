# Implementation Plan - Project Refactor & Access Denied Integration

This plan outlines the systematic refactor of the Intern Management System to adopt a modern `src/` layout, reorganize role-based dashboards using Next.js Route Groups, and deeply integrate the `AccessDenied` protection.

## User Review Required

> [!IMPORTANT]
> **Project Renaming**: The previous attempt to rename the root directory failed because `Rename-Item` is a PowerShell command, but it was executed in a `bash` environment.
> 
> **Directory Migration**: Moving `app/`, `components/`, `lib/`, and `types/` into `src/` will require updating all import paths. We will primarily rely on the `@/*` alias update in `tsconfig.json`.
> 
> **Route Grouping**: Reorganizing `dashboard/admin`, `dashboard/mentor`, and `dashboard/intern` into route groups `(admin)`, `(mentor)`, and `(intern)` allows for shared layouts without affecting the URL structure.

## Proposed Changes

### 1. Root & Configuration
- [ ] **Rename Project Folder** (Use CMD):
    ```cmd
    cd ..
    ren "intern-management-system - Copy" "intern-management-system-v2"
    cd intern-management-system-v2
    ```
- [ ] **Initialize `src` Layout**:
    ```cmd
    if not exist src mkdir src
    ```
- [ ] **[MODIFY] tsconfig.json**: Update path alias to `"@/*": ["./src/*"]`.

### 2. Directory Migration
- [ ] **Move core directories**:
    ```cmd
    move app src
    move lib src
    move types src
    move src\app\components src\
    move src\app\styles src\
    if exist src\app\lib\redux (
        if not exist src\lib\redux mkdir src\lib\redux
        move src\app\lib\redux\* src\lib\redux\
    )
    rmdir /s /q src\app\lib
    ```

### 3. Route Grouping
- [ ] **Reorganize Dashboard Roles**:
    ```cmd
    mkdir "src\app\(admin)\dashboard"
    mkdir "src\app\(mentor)\dashboard"
    mkdir "src\app\(intern)\dashboard"
    move src\app\dashboard\admin "src\app\(admin)\dashboard\"
    move src\app\dashboard\mentor "src\app\(mentor)\dashboard\"
    move src\app\dashboard\intern "src\app\(intern)\dashboard\"
    ```
- [ ] **[NEW] Group Layouts**: Create `layout.tsx` for `(admin)`, `(mentor)`, and `(intern)` to apply `RoleGuard`.

### 4. Access Denied Integration
- [ ] **[NEW] `src/components/ui/AccessDenied.tsx`**: Reusable UI component.
- [ ] **[NEW] `src/components/layout/RoleGuard.tsx`**: Higher-order component to protect routes.
- [ ] **[MODIFY] src/app/access-denied/page.tsx**: Refactor to use the new component.

### 5. Cleanup
- [ ] **Cleanup Legacy Files**:
    ```cmd
    del /q app.zip
    del /q src\app\page_new.tsx
    ```

## Verification Plan

### Automated Tests
- `npm run dev`: Verify the application builds and starts.
- `npm run build`: Ensure all import paths are resolved correctly.

### Manual Verification
- Test login with different roles (Admin, Mentor, Intern).
- Verify `/dashboard/admin` access is restricted for non-admins via `RoleGuard`.
- Verify styles/icons load correctly from new paths.
