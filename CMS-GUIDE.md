# Pocky website editor

The editor is designed for pockyasianrestaurant.com.au/admin. It works on phones and computers. Your account needs to be invited by the website designer.

## Add a banner and popup

1. Sign in and choose **Announcements**.
2. Choose **Add announcement**, or start with **Closed this Saturday**, **Christmas lunch**, or **Father’s Day**.
3. Enter a short title for the banner, and the longer message for the popup.
4. Add a button label and an HTTPS booking link if needed. Holiday templates include Pocky’s booking portal.
5. Switch **Enabled** on. Add start and end times if you want it scheduled. All times use Queensland time (AEST).
6. Choose **Preview changes**, then **Publish changes**.

The popup appears once per browser visit. Guests can reopen it using the top banner. Changes to the announcement allow the updated popup to appear again. The popup can be closed with its close button or Escape. Scheduled announcements stop appearing at the end time.

## Replace a PDF menu

Choose **PDF menus**, select the main or kids menu, upload a PDF smaller than 4 MB, then publish. Uploading alone does not replace the live menu.

## Update hours or copy

Choose **Opening hours** or **Website copy**, edit the fields, then publish. Opening hours update both the footer and ordering information. Colours, fonts, graphics and page layout remain under your designer’s control.

## Before leaving

Publish your changes before leaving the page. The editor warns if you have unpublished changes. If another editor has published first, reload before making further changes so their work is not overwritten.

## Designer setup and maintenance

The implementation uses Netlify Identity 2.0 and Netlify Blobs. It does not grant clients GitHub repository or Netlify dashboard access.

- Enable Netlify Identity, set registration to **Invite only**, and invite the approved email addresses.
- Assign each editor the **content-editor** role in Identity. The server reads current roles before accepting writes.
- The client must choose their own password through the invitation link. Identity invitation and recovery links arriving at the homepage redirect to /admin.
- Build command: npm run build. Publish folder: dist. Function source: cms-functions.
- Content and uploaded PDFs live in the site-wide **pocky-content-v1** Blobs store and persist across website deployments. Previous published content is stored under private history keys. Use the Netlify Blobs tools for designer-led recovery.
- PDFs are public website downloads. Upload only menus intended for publication.
- The API allows public reading of published content. Authenticated writes require the content-editor role, a same-origin request, validated fixed content fields, and the current content revision.
- Deploy previews use a separate **pocky-preview-v1** content store, so preview edits cannot change the production website.
- Changes appear on newly loaded pages. Already open pages refresh announcement schedules every 30 seconds using the content loaded at page opening.
- Netlify hosting usage applies to function calls and storage. No separate CMS subscription is added; check existing plan allowances before client handover.

## Verification completed

Production build completed locally. Eight automated checks cover schema limits, unsafe links, AEST schedule boundaries, valid menu paths, public defaults, editor authorization and origin checks, conflicting edits, and PDF validation. Browser checks cover local preview publication, banner and popup rendering, popup dismissal, and a 390 px mobile editor layout. Real login and production publishing require Identity activation and an invited editor account, and must be verified before handover.
