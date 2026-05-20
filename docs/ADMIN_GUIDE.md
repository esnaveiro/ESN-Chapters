# Admin Guide

This guide is for HR Managers and IT Managers using the ESN Chapters admin panel. No technical background required.

---

## Logging in

Go to `/admin` on your section's site (or click the lock icon in the top-right corner of the public nav). Enter the email and password you received in your invitation email.

If you have not received an invitation, ask your IT Manager to invite you from the Settings page.

---

## Members

### Adding a new member

1. Go to **Admin → Members → New member**
2. Fill in the member's full name and join date
3. Add their status history — one or more entries with a status and start date. Leave the date blank to use the join date
4. Optionally set their buddy (who mentored them) and any newbies they are mentoring
5. Upload a photo (optional but recommended)
6. Save — the member is now visible on the public site

The **slug** (used in the member's URL) is generated automatically from the full name.

### Editing a member

Go to **Admin → Members**, find the member, and click **Edit**.

You can update their name, photo, bio, favourite memory, LinkedIn URL, and whether they have left the section (`leftAt` date).

### Editing a member's status history

Member statuses follow this progression:

```
Newbie → Candidate Member → Junior → Senior → Alumni
```

On the member's edit page, the **Status history** section shows all status entries with their start dates. You can add, edit, or remove entries and click **Save status history** to apply. End dates are computed automatically from the next entry's start date.

The full status history is shown on the member's public profile.

### Assigning buddy relationships

A buddy is an experienced member paired with a newbie to help them integrate. The relationship is directional: one person is the buddy, the other is the newbie. A buddy can mentor multiple newbies.

On the member's edit page, the **Buddy relationships** section has two parts:

- **My buddy** — who mentored this member when they joined (one person, optional)
- **My newbies** — members this person is mentoring (multiple, optional)

You can set both directions from either member's edit page. Changes on one side are immediately reflected on the other.

Buddy relationships appear in the **Network** graph on the public site.

### Tributes

A tribute is a short message written by one member about another. Tributes appear on the recipient's public profile.

You can add or remove tributes from two places:

- **Member edit page** — the **Tributes** section shows all tributes this member has received. Select an author, write the message, optionally set a date, and click **Add tribute**.
- **Admin → Tributes** — a dedicated page showing all tributes across all members, with a quick-add form (From, To, message, date) at the top.

### Bulk actions

On the Members list page, checkboxes appear next to each row. Select individual members or use **Select all** to select everyone visible. A bar appears at the bottom of the screen — click **Delete** once to arm, then **Confirm delete** to permanently remove the selected members.

---

## Mandates

A mandate represents one academic year of the board.

### Creating a mandate

1. Go to **Admin → Mandates → Create mandate**
2. Fill in the name (e.g. "Board 2024/25"), academic year, and start date
3. Upload a team photo (optional)
4. Save

### Adding members to a mandate

1. Open the mandate's edit page
2. In the **Team** section, click **Add member**
3. Select the member, their department, and role title
4. Save

Members can belong to multiple mandates across different years.

### Removing a member from a mandate

On the mandate's edit page, find the member in the Team section and click the remove button next to their name.

### Adjusting the team photo crop

After uploading a team photo, click **Adjust crop** to open the crop editor. Click or drag on the full photo to set the focal point — the **Folder preview** below updates live to show exactly how the photo will appear in the board page folders. Click **Apply** to save, or **Cancel** to discard.

The focal point is saved with the mandate and used on the public board page.

### Adding milestones to a mandate

On the mandate's edit page, scroll to the **Milestones** section at the bottom. Fill in the title, optional description, date, and type, then click **Add milestone**. Milestones can also be managed globally from **Admin → Milestones**.

### Bulk actions

On the Mandates list page, checkboxes allow selecting multiple mandates for bulk deletion.

---

## Milestones

Milestones mark significant moments in the section's history — a first event of a new type, an award, a record attendance, etc.

### Creating a milestone

1. Go to **Admin → Milestones → Add milestone**
2. Fill in the title, date, type, and an optional description
3. Optionally link it to a mandate
4. Save

Alternatively, add milestones directly from a mandate's edit page — they are pre-linked to that mandate automatically.

Milestones appear on the **Timeline** page and on the linked mandate's detail page.

### Bulk actions

On the Milestones list page, checkboxes allow selecting multiple milestones for bulk deletion.

---

## Tributes

**Admin → Tributes** shows all tributes written across the section in one place.

- The **Add tribute** form at the top lets you quickly record a tribute: select the author (From), recipient (To), write the message, and optionally set the date (defaults to today)
- Each row shows the author → recipient, the message, and the date
- Click **Delete** then **Confirm** to remove a tribute
- Both names link directly to their edit pages

### Bulk actions

Checkboxes allow selecting multiple tributes for bulk deletion.

---

## Badges

Badges are custom recognitions you can award to members (e.g. "Best Onboarding", "100 Events Volunteer").

### Creating a badge

1. Go to **Admin → Badges → New badge**
2. Give it a name, description, and optional icon
3. Save

### Awarding a badge

1. Go to **Admin → Badges**, find the badge and click **Edit**
2. In the **Awards** section, select a member and enter the award date
3. Click **Award** — the badge appears on their public profile immediately

### Revoking a badge

On the badge's edit page, find the member in the Awards section and click **Revoke**.

### Bulk actions

On the Badges list page, checkboxes allow selecting multiple badges for bulk deletion.

---

## Settings (IT Manager)

### Inviting a new admin

1. Go to **Admin → Settings**
2. Enter the new admin's email address and click **Send invitation**
3. They will receive an email — clicking the link takes them to a set-password page where they choose their password and are signed in automatically

> **Note:** Supabase's free tier allows 2 invitation emails per hour. If you hit the limit, wait an hour or configure a custom SMTP provider in the Supabase dashboard.

All admins have full access to the admin panel. There are no separate permission levels.

### Viewing and revoking admin access

The **Settings** page lists all admin accounts with their email, join date, and last sign-in. To remove someone's access, click **Revoke access** next to their name and confirm. You cannot revoke your own account.

### Changing your password

Use the Supabase Auth email link. From the login page, click **Forgot password** and follow the instructions.

---

## Tips

- **Photos**: Upload square or near-square images for member photos. Landscape photos work best for mandate team photos.
- **Photo crop**: After uploading a mandate photo, always use **Adjust crop** to set the focal point so key faces aren't cut off in the board folders.
- **Slugs**: Member slugs are used in public URLs (e.g. `/members/ana-silva`). Changing a slug after sharing the URL will break existing links.
- **Dates**: All dates are stored without time. The join date and status start dates affect what appears on a member's timeline.
- **Favourite memory**: This appears as a pull quote on the member's public profile — encourage members to write something personal.
- **Bulk delete**: Deletion is permanent and cannot be undone. The two-step confirm (click Delete → click Confirm) is there to prevent accidents.
