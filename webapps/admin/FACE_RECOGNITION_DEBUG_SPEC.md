# Face Recognition Debug Screen - UX Specification

## 1. Goal

Provide a simple interface for developers/admins to test the face detection and recognition pipeline by uploading an image within the context of a specific group and examining the results for each detected face.

## 2. Location

The debug screen will reside at the route `/dashboard/face-recognition-debug` within the admin web application.

## 3. Layout

-   **Desktop Only:** Two-column layout.
    -   **Left Column:** Group Selection, Image Upload & Display Area.
    -   **Right Column:** Detected Faces & Recognition Results Area.
-   **Directionality:** The layout must support Right-to-Left (RTL) presentation.

## 4. Initial State

-   **Left Column:**
    -   A Group Selection component (e.g., a searchable dropdown/select). Initially shows "Select a Group...".
    -   Below the group selector (disabled initially): A prominent drag-and-drop zone (`react-dropzone`) with text: "Select a group first".
-   **Right Column:** Placeholder text: "Upload an image after selecting a group to see detected faces."

## 5. User Flow: Group Selection

1.  **Action:** User interacts with the Group Selection component.
2.  **Data Fetching:** The component fetches a list of available groups using `GroupsApi.getAllGroups` or `GroupsApi.queryGroups`.
3.  **Selection:** User selects a specific group from the list.
4.  **State Update:**
    -   The selected `groupId` is stored in the component's state.
    -   The Image Uploader (dropzone) below is enabled.
    -   The dropzone text updates to: "Drag & drop an image file here, or click to select".

## 6. User Flow: Image Upload & Detection

1.  **Precondition:** A group must be selected.
2.  **Action:** User drags an image file (JPEG, PNG) onto the dropzone or clicks to select a file.
    -   *Validation:* Client-side check for valid image types.
3.  **Feedback:** A loading spinner/indicator overlays the dropzone. Dropzone is disabled. Group selection might also be disabled during processing.
4.  **API Call (Detect):**
    -   Client calls `FaceRecognitionApi.detectFaces` (or potentially `extractFaces` if more details are needed upfront).
    -   **Request:** `DetectFacesDto` containing `{ image: <base64_string> }`.
    -   **Response:** `DetectFacesResponseDto` (or `ExtractFacesResponseDto`) containing `{ faces: [{ faceId: string, boundingBox: { /*...*/ }, croppedFaceImage?: <base64_string> /* other detection data */ }] }` or an error.
5.  **State Update (Success):**
    -   **Left Column:**
        -   Dropzone replaced by the uploaded image.
        -   Semi-transparent bounding boxes rendered over the image for each detected face.
        -   Bounding boxes have a hover effect.
        -   *(Optional)* Clicking a box scrolls the right panel to the corresponding face card and highlights it.
    -   **Right Column:**
        -   Placeholder text replaced by a list/grid of "Detected Face Cards".
        -   If `response.faces` is empty, display: "No faces detected in the uploaded image."
6.  **State Update (Error):**
    -   Display an error message (e.g., using a toast notification or inline message).
    -   Reset the dropzone state (but keep the group selected). Re-enable the dropzone and group selector.

## 7. Detected Face Card Component

-   **Display:**
    -   Cropped face image (`face.croppedFaceImage`).
    -   Unique identifier (e.g., "Face #1").
    -   "Recognize Face" button.
    -   Area for recognition results (initially empty).
-   **Interaction:**
    -   Hovering over the card highlights the corresponding bounding box on the main image.

## 8. User Flow: Face Recognition

1.  **Action:** User clicks the "Recognize Face" button on a specific face card.
2.  **Feedback:** Loading spinner shown *within that card*. "Recognize Face" button disabled.
3.  **API Call (Recognize):**
    -   Client calls `FaceRecognitionApi.recognizeFace`.
    -   **Request:** `RecognizeFaceDto` containing `{ image: <base64_cropped_face_image>, groupId: <selected_groupId> }`. **Note:** The API requires the *image data* of the face to recognize, not just an ID from the detection step. The `groupId` from the initial selection is crucial here.
    -   **Response:** `RecognizeFaceResponseDto` containing `{ personId: string, personName: string, confidence: number, participantId?: string, participantName?: string }` or a "no match" message or an error.
4.  **State Update (Success/No Match):**
    -   **Specific Face Card:**
        -   Loading spinner removed.
        -   Recognition results displayed:
            -   "**Person:** [personName] (ID: [personId])"
            -   "**Confidence:** [confidence score]" (formatted, potentially color-coded).
            -   "**Participant:** [participantName] (ID: [participantId])" (if available).
            -   Or: "No match found."
        -   *(Optional)* Add a "Re-recognize" button.
5.  **State Update (Error):**
    -   **Specific Face Card:** Display the error message. Button might become enabled again.

## 9. Reset Functionality

-   A "Clear / Upload New" button should be available.
-   Clicking it resets the UI: clears the image, clears detected faces/results, re-enables the dropzone (if a group is still selected). It should *not* clear the selected group.
-   Perhaps add a "Change Group" button or allow clicking the group selector again to reset fully.

# Implementation Tasks

1.  **Backend API Endpoints:**
    -   Ensure `FaceRecognitionApi.detectFaces` (or `extractFaces`) endpoint exists and functions as expected for the frontend.
    -   Ensure `FaceRecognitionApi.recognizeFace` endpoint exists, accepts `RecognizeFaceDto` (including `image` and `groupId`), and performs recognition within the specified group context.
2.  **Frontend Setup:**
    -   Create the new route and page file: `shula/webapps/admin/app/dashboard/face-recognition-debug/page.tsx`.
    -   Define necessary TypeScript types derived from the API client models (`DetectFacesResponseDto`, `RecognizeFaceResponseDto`, `GroupsResponseDto`, etc.) in `shula/webapps/admin/app/dashboard/face-recognition-debug/types.ts` (or directly use imported types).
3.  **Group Selection Component:**
    -   Create a component (e.g., `GroupSelector.tsx`).
    -   Use `GroupsApi` to fetch and display groups (consider caching/memoization).
    -   Implement filtering/searching groups by name within the component.
    -   Handle selection and update parent component state with the selected `groupId`.
    -   Make it searchable if the list of groups is long.
4.  **Image Uploader Component:** (`ImageUploader.tsx`)
    -   Implement drag-and-drop zone (`react-dropzone`).
    -   Should be disabled until a group is selected.
    -   Handle file selection, type validation, and Base64 encoding.
    -   Display loading state during upload.
5.  **Image Display Component:** (`ImageDisplay.tsx`)
    -   Display the uploaded image.
    -   Render bounding boxes based on detection results.
    -   Implement hover effects and interaction with face cards.
6.  **Detected Face Card Component:** (`DetectedFaceCard.tsx`)
    -   Display cropped face image, ID.
    -   Include the "Recognize Face" button, passing necessary data (cropped face image data) for the API call.
    -   Show loading state during recognition.
    -   Display recognition results or error messages.
    -   Implement hover effect linking to the main image's bounding box.
7.  **Main Page Logic:** (`page.tsx` and potentially a hook `useFaceRecognitionDebug.ts`)
    -   Integrate components.
    -   Manage overall state (selected `groupId`, uploaded image, detected faces, recognition results per face).
    -   Implement API call logic using the generated clients (`FaceRecognitionApi`, `GroupsApi`).
    -   Handle loading and error states.
    -   Implement the "Clear / Upload New" functionality.
8.  **Styling:** Apply appropriate styling (Mantine UI?) considering RTL. Ensure components are laid out correctly in the two-column structure. 