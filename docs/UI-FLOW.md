# UI-flow: DataRoom Application Analysis

**Date**: 2025-11-22
**Status**: Complete
**Purpose**: Detailed analysis of the current UI/UX to define key elements and graphical settings.

## Table of Contents
1. [Authentication](#authentication)
2. [Dashboard](#dashboard)
3. [Document Management](#document-management)
4. [Folder Management](#folder-management)
5. [Data Rooms](#data-rooms)
6. [Secure Links](#secure-links)
7. [Team Management](#team-management)
8. [Settings](#settings)

---

## 1. Authentication

### Login Page
**URL**: `/auth/login`

**Layout & Structure**:
- **Type**: Centered Card Layout
- **Background**: Clean, likely neutral or subtle pattern
- **Container**: Centered card containing the form

**Key Elements**:
- **Logo/Branding**: Top of the card
- **Form Fields**:
  - Email Address (Input)
  - Password (Input, obscured)
- **Actions**:
  - "Sign In" (Primary Button, full width)
  - "Sign in with Authentik" (Secondary/SSO Button)
- **Navigation**: Links to "Forgot Password" or "Sign Up" (if enabled)

**User Flow**:
1. User arrives at `/auth/login`.
2. Enters credentials.
3. Clicks "Sign In".
4. On success: Redirects to `/dashboard`.
5. On failure: Displays error message inline.

**Visual Reference**:
![Login Page](/Users/f.gallo/.gemini/antigravity/brain/0f3cb346-4b3b-49fe-b29d-345d627f86f4/login_page_1763813294943.png)

---

## 2. Dashboard

### Main Dashboard
**URL**: `/dashboard`

**Layout & Structure**:
- **Type**: Dashboard / Admin Panel
- **Header**: Fixed top navigation bar
- **Content Area**: Grid-based layout for widgets/cards

**Key Elements**:
- **Header**:
  - **Left**: Logo/Brand Name
  - **Center/Left**: Main Navigation Links (Dashboard, Documents, Data Rooms, etc.)
  - **Right**: User Profile Menu (Dropdown), Notifications (Bell icon)
- **Stats Overview**: Row of cards displaying key metrics (e.g., Total Documents, Active Links, Storage Used).
- **Quick Actions**: Buttons for common tasks (e.g., "Upload Document", "Create Data Room").
- **Recent Activity**: List or table showing recent user actions or file updates.

**User Flow**:
- Central hub for navigation.
- Provides immediate insight into system status.
- Quick access to primary modules.

**Visual Reference**:
![Dashboard Page](/Users/f.gallo/.gemini/antigravity/brain/0f3cb346-4b3b-49fe-b29d-345d627f86f4/dashboard_page_1763813322630.png)

---

## 3. Document Management

### Documents List
**URL**: `/documents`

**Layout & Structure**:
- **Type**: List/Table View
- **Header**: Title, "Upload Document" button, "Create Folder" button (recently added)
- **Stats**: Row of cards showing document-specific metrics
- **Content**: Search/Filter bar followed by a data table

**Key Elements**:
- **Stats Cards**: Total Documents, Total Links, Total Views, Storage Used.
- **Search Bar**: Full-width search input with filter toggle.
- **Document Table**:
  - Columns: Name, Type, Size, Links count, Views count, Created Date, Actions.
  - Actions: Context menu or buttons for View, Share, Delete.
- **Empty State**: Prominent illustration and call-to-action if no documents exist.

**User Flow**:
1. User navigates to `/documents`.
2. Views list of uploaded files.
3. Can search or filter list.
4. Can initiate upload or folder creation.
5. Can perform actions on individual files.

**Visual Reference**:
![Documents Page](/Users/f.gallo/.gemini/antigravity/brain/0f3cb346-4b3b-49fe-b29d-345d627f86f4/documents_page_ui_1763813382653.png)

### Upload Interface
**URL**: `/documents/upload`

**Layout & Structure**:
- **Type**: Form / Dropzone
- **Container**: Centered or full-width upload area

**Key Elements**:
- **Dropzone**: Large area to drag and drop files.
- **File List**: List of selected files pending upload.
- **Settings**: Options for destination folder, tags, etc. (if applicable).
- **Actions**: "Upload" (Primary), "Cancel" (Secondary).

**Visual Reference**:
![Upload Page](/Users/f.gallo/.gemini/antigravity/brain/0f3cb346-4b3b-49fe-b29d-345d627f86f4/upload_page_ui_1763813398838.png)

---

## 4. Folder Management

### Folders List
**URL**: `/folders`

**Layout & Structure**:
- **Type**: Grid View
- **Header**: Title, "New Folder" button
- **Content**: Search bar followed by a grid of folder cards

**Key Elements**:
- **Folder Card**:
  - Icon (Folder)
  - Name (Link to folder details)
  - Description (Optional)
  - Metadata: Document count, Subfolder count, Creation date.
  - Actions: Dropdown menu (Open, Delete).
- **Search Bar**: To filter folders by name.
- **Create Dialog**: Modal to enter folder name and select team.

**User Flow**:
1. User navigates to `/folders`.
2. Views grid of existing folders.
3. Clicks "New Folder" to create a container.
4. Clicks a folder card to navigate into it (likely to `/folders/[id]`).

**Visual Reference**:
![Folders Page](/Users/f.gallo/.gemini/antigravity/brain/0f3cb346-4b3b-49fe-b29d-345d627f86f4/folders_page_ui_1763813416350.png)
![New Folder Dialog](/Users/f.gallo/.gemini/antigravity/brain/0f3cb346-4b3b-49fe-b29d-345d627f86f4/new_folder_dialog_ui_1763813439046.png)

---

## 5. Data Rooms

### Data Rooms List
**URL**: `/datarooms`

**Layout & Structure**:
- **Type**: List/Card View
- **Header**: Title ("Data Rooms"), "Create Data Room" button
- **Content**: Empty state message ("No data rooms yet") with an illustration and a "Create Data Room" button within the content area.

**Key Elements**:
- **Empty State**: Prominent illustration and call-to-action ("Create your first data room...") if no data rooms exist.
- **Data Room Card** (if present): Would likely show Name, Description, Document count, Link count, Last updated, Actions.
- **Create Modal**: Multi-step dialog ("Create New Data Room", Step 1 of 2) for Name, Description, then likely adding documents/folders in step 2.

**User Flow**:
1. User navigates to `/datarooms`.
2. Views existing data rooms or empty state.
3. Clicks "Create Data Room" to open modal.

**Visual Reference**:
![Data Rooms Page](/Users/f.gallo/.gemini/antigravity/brain/0f3cb346-4b3b-49fe-b29d-345d627f86f4/datarooms_page_ui_1763813488020.png)
![Create Data Room Modal](/Users/f.gallo/.gemini/antigravity/brain/0f3cb346-4b3b-49fe-b29d-345d627f86f4/create_dataroom_modal_ui_1763813493720.png)

---

## 6. Secure Links

### Links List
**URL**: `/links`

**Layout & Structure**:
- **Type**: List/Table View
- **Header**: Title ("Links"), "Create Link" button
- **Content**: Empty state message ("No links yet") with an illustration and a "Create Link" button within the content area.

**Key Elements**:
- **Empty State**: Prominent illustration and call-to-action ("Create your first link...") if no links exist.
- **Links Table** (if present): Would likely show Link Name/URL, Target Document/Folder, Views, Last Accessed, Status, Actions.
- **Create Modal**: Dialog ("Create New Link") to select document/folder, set link settings (password, expiry, etc.).

**User Flow**:
1. User navigates to `/links`.
2. Views existing links or empty state.
3. Clicks "Create Link" to open modal.

**Visual Reference**:
![Links Page](/Users/f.gallo/.gemini/antigravity/brain/0f3cb346-4b3b-49fe-b29d-345d627f86f4/links_page_ui_1763813496465.png)
![Create Link Modal](/Users/f.gallo/.gemini/antigravity/brain/0f3cb346-4b3b-49fe-b29d-345d627f86f4/create_link_modal_ui_1763813503018.png)

---

## 7. Team Management

### Teams List
**URL**: `/teams`

**Layout & Structure**:
- **Type**: List/Card View
- **Header**: Title ("Teams"), "Create Team" button
- **Content**: Empty state or list of teams.

**Key Elements**:
- **Empty State**: If no teams, a message and "Create Team" button.
- **Team Card** (if present): Team Name, Member count, Actions (View, Settings, Invite).
- **Create Page**: `/teams/create` - form to enter team name.

**User Flow**:
1. User navigates to `/teams`.
2. Views existing teams or empty state.
3. Clicks "Create Team" to go to `/teams/create`.

**Visual Reference**:
![Teams Page](/Users/f.gallo/.gemini/antigravity/brain/0f3cb346-4b3b-49fe-b29d-345d627f86f4/teams_page_ui_1763813570878.png)
![Create Team Page](/Users/f.gallo/.gemini/antigravity/brain/0f3cb346-4b3b-49fe-b29d-345d627f86f4/create_team_page_ui_1763813571574.png)

---

## 8. Settings

### Main Settings
**URL**: `/settings`

**Layout & Structure**:
- **Type**: Tabbed Interface
- **Sidebar/Tabs**: Navigation for different settings sections (Profile, Team, Billing, etc.)
- **Content Area**: Displays form/content for the selected section.

**Key Elements**:
- **Navigation**: Vertical or horizontal tabs (Profile, Team, Billing, Branding, Privacy).
- **Profile Section**: Form to update user name, email, password.

**User Flow**:
1. User navigates to `/settings`.
2. Selects a settings category from the navigation.
3. Views/modifies settings in the content area.

**Visual Reference**:
![Settings Page](/Users/f.gallo/.gemini/antigravity/brain/0f3cb346-4b3b-49fe-b29d-345d627f86f4/settings_page_ui_1763813573799.png)
![Profile Settings](/Users/f.gallo/.gemini/antigravity/brain/0f3cb346-4b3b-49fe-b29d-345d627f86f4/profile_settings_ui_1763813574719.png)
