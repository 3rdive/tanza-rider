# Document Upload Flow Update - Summary

## Changes Made

### 1. API Types and Endpoints (`lib/api.ts`)

#### New Interfaces Added:

- `IRiderDocument`: Represents a single document with fields like `docName`, `docUrl`, `documentStatus`, `expirationDate`, and `rejectionReason`
- `IRequiredDocument`: Represents required documents for a vehicle type with `docName`, `requiresExpiration`, `isRequired`, and `vehicleType`
- `IDocumentUpload`: Payload for uploading documents with `docName`, `docUrl`, and optional `expirationDate`

#### Updated Interfaces:

- `IRider`: Now includes an optional `documents` array of type `IRiderDocument[]`
- `IUpdateRiderPayload`: Simplified to only include `vehicleType` and `documentStatus` (removed old fields like `vehiclePhoto`, `driverLicense`, `vehiclePapers`)

#### New API Endpoints:

- `getRequiredDocuments(vehicleType)`: GET `/api/v1/riders/me/documents/required?vehicleType={type}`
- `uploadDocuments(documents)`: POST `/api/v1/riders/me/documents` with array of documents
- `deleteDocument(documentId)`: DELETE `/api/v1/riders/me/documents/{id}`

### 2. Rider Hook (`hooks/rider.hook.ts`)

#### New State Variables:

- `loadingRequiredDocs`: Loading state for fetching required documents
- `uploadingDocuments`: Loading state for uploading documents
- `deletingDocument`: Loading state for deleting documents
- `documents`: Array of rider's uploaded documents

#### New Methods:

- `getRequiredDocuments(vehicleType)`: Fetches required documents for a specific vehicle type
- `uploadDocuments(documents)`: Uploads or updates multiple documents
- `deleteDocument(documentId)`: Deletes a specific document

### 3. Document Verification Component (`app/profile/document.tsx`)

#### Complete Refactor:

- Now fetches required documents dynamically based on vehicle type
- Displays document status indicators (APPROVED ✓, REJECTED ✗, PENDING ⋯) for each document
- Shows rejection reasons for rejected documents
- Includes expiration date input for documents that require it
- Validates all required documents and expiration dates before submission
- Handles individual document uploads with the new API structure

#### New Features:

- Dynamic document loading based on vehicle type
- Per-document status display
- Expiration date management
- Better validation and error handling
- Support for viewing uploaded documents
- Scrollable content area

## New Flow

1. **Select Vehicle Type**: User selects bike, bicycle, or van (only allowed when documentStatus is INITIAL or empty)
2. **Fetch Required Documents**: System fetches the list of required documents for that vehicle type
3. **Upload Documents**: User uploads each required document individually
4. **Set Expiration Dates**: For documents requiring expiration, user enters the date
5. **Submit All**: Once all documents are uploaded, user submits them together
6. **Update Status**: System updates rider's documentStatus to PENDING
7. **Review Status**: Documents are set to PENDING status and can be approved/rejected individually
8. **Re-upload if Rejected**: If any document is rejected, user can see the reason and re-upload (but cannot change vehicle type)

## Important Business Rules

1. **Vehicle Type Change**:

   - Can only be changed when `documentStatus` is `INITIAL` or empty
   - Once documents are submitted (status becomes PENDING, APPROVED, or REJECTED), vehicle type is locked
   - Uses the `PATCH /api/v1/riders/me` endpoint to update vehicle type

2. **Document Submission**:
   - First uploads all documents via `POST /api/v1/riders/me/documents`
   - Then updates rider status to PENDING via `PATCH /api/v1/riders/me` with `{ documentStatus: "PENDING" }`
   - This two-step process ensures documents are uploaded before status changes

## API Integration

The component now properly integrates with the new endpoints:

- Fetches required fields based on vehicle type selection
- Uploads individual document files to storage
- Submits all document metadata (URLs + expiration dates) to the backend
- Displays individual document statuses and rejection reasons
- Allows re-upload of rejected documents

## Benefits

1. **Flexibility**: Admin can define different required documents per vehicle type
2. **Better UX**: Users see clear status for each document
3. **Granular Control**: Individual documents can be approved/rejected
4. **Expiration Tracking**: Documents with expiration dates are properly tracked
5. **Better Error Handling**: Clear validation and error messages
