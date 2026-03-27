# Ad Hoc Events Workflow

## Adding an Event
1. User submits Event Request form.
2. Admin reviews the **"Adhoc"** sheet in **"Ad Hoc Events"** spreadsheet.
    - It is **NOT necessary** to select a county in the dropdown.
    - Links should be verified working (click to see where they go).
    - Ensure a valid title is used with no redundant information (i.e., we don't need the day of week).
    - Update blurb to remove redundant information and links.
3. When all changes have been updated, switch **Approved** to `YES`.
4. Refresh the page *(Open-page trigger does not appear to work on iOS Google Sheets app.)*.
5. Script should populate the appropriate county.
    - If error, manually set the county and refresh the page.
6. **If successful:** An ID is added to the `EVENT_ID` column.

## Removing an Event
1. Switch the **Approved** value to `NO`.
2. Refresh the page.
    - The `EVENT_ID` will disappear.
    - Status will change to **Removed**.

## Updating an Event
1. Remove the event following instructions above.
2. Update the columns that need updating.
3. Add the event again following the "Adding an Event" steps.


---

# Ad Hoc Featured Events Workflow

## Adding a Featured Event
1. User submits a Featured Event Request form.
2. Admin follows the same workflow as **Adding an Event**, but with fewer fields to review.

## Removing / Updating a Featured Event
1. Admin follows the same workflow as **Adding an Event**, but with fewer fields to review.


---

# Featuring an Event

1. User submits a Featured Event Request form.
2. Admin thoroughly reviews the **"Requests"** sheet in **"Featured Events"** spreadsheet to ensure it meets "featured" criteria.
    - Edit provided **Description** to remove redundant information (location, time, frequency, etc.).
    - It is **NOT necessary** to select a county in the dropdown.
    - Links should be verified working (click to see where they go).
    - Ensure a valid title is used with no redundant information (i.e., we don't need the day of week).
    - If description contains a link, format it accordingly (add `target="_blank"` in anchor tag).
    - Check description for any exceptions to their audience selection and add this text to the **"Audience Suffix"** column.
3. When all changes have been updated, switch **Approved** to `YES`.
4. Refresh the page *(Open-page trigger does not appear to work on iOS Google Sheets app.)*.
5. Script should populate the appropriate county.
    - If error, manually set the county and refresh the page.
6. The row will be moved to the **"Featured Events"** sheet.
7. It will appear with an **Enabled** status of `YES`, however, it is not yet on the site.
8. The contents of the **"Featured Events"** sheet control all featured events on the site.
    - A script, **FeaturedEventYmlGenerator**, must be manually run to generate a YAML file.
    - The contents of this file must replace the contents of `featured_events.yml` in the `njboardgames` repo.
    - Automation for this step is still in progress.