/**
 * Supabase Storage Utilities for private 'answer-sheets' bucket.
 * Manages signed URL generation (1-hour expiry), path extraction, and storage cleanups.
 */

const DEFAULT_EXPIRY_SECONDS = 3600; // 1 hour (3600s)

/**
 * Extracts relative storage path from a raw path or full URL.
 * e.g., 'https://xyz.supabase.co/storage/v1/object/public/answer-sheets/exam-1/file.pdf' -> 'exam-1/file.pdf'
 * or 'exam-1/file.pdf' -> 'exam-1/file.pdf'
 */
export function extractStoragePath(pathOrUrl) {
  if (!pathOrUrl || typeof pathOrUrl !== 'string') return null;

  // If it's already a relative storage path (doesn't start with http/https)
  if (!pathOrUrl.startsWith('http://') && !pathOrUrl.startsWith('https://')) {
    // Strip leading slashes if any
    return pathOrUrl.replace(/^\/+/, '');
  }

  try {
    const url = new URL(pathOrUrl);
    const pathname = decodeURIComponent(url.pathname);
    const bucketMarker = '/answer-sheets/';
    const index = pathname.indexOf(bucketMarker);
    if (index !== -1) {
      return pathname.substring(index + bucketMarker.length).replace(/^\/+/, '');
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Generates an ephemeral 1-hour signed URL for a single file in 'answer-sheets'.
 */
export async function getSignedAnswerSheetUrl(supabase, pathOrUrl, expiresIn = DEFAULT_EXPIRY_SECONDS) {
  const filePath = extractStoragePath(pathOrUrl);
  if (!filePath) return pathOrUrl || null;

  try {
    const { data, error } = await supabase.storage
      .from('answer-sheets')
      .createSignedUrl(filePath, expiresIn);

    if (error || !data?.signedUrl) {
      console.warn(`[Storage] Failed to create signed URL for '${filePath}':`, error?.message);
      return pathOrUrl;
    }

    return data.signedUrl;
  } catch (err) {
    console.warn(`[Storage] Error creating signed URL:`, err.message);
    return pathOrUrl;
  }
}

/**
 * Batch resolves signed URLs for a list of items containing answer sheet paths/URLs.
 * Generates signed URLs concurrently.
 */
export async function attachSignedUrlsToStudents(supabase, students, urlField = 'answer_sheet_url', expiresIn = DEFAULT_EXPIRY_SECONDS) {
  if (!Array.isArray(students) || students.length === 0) return students;

  return Promise.all(
    students.map(async (student) => {
      if (!student || !student[urlField]) return student;
      const signedUrl = await getSignedAnswerSheetUrl(supabase, student[urlField], expiresIn);
      return {
        ...student,
        [urlField]: signedUrl,
      };
    })
  );
}

/**
 * Deletes a single answer sheet file from 'answer-sheets'.
 */
export async function deleteAnswerSheetFile(supabase, pathOrUrl) {
  const filePath = extractStoragePath(pathOrUrl);
  if (!filePath) return;

  try {
    const { error } = await supabase.storage
      .from('answer-sheets')
      .remove([filePath]);

    if (error) {
      console.warn(`[Storage] Failed to delete file '${filePath}':`, error.message);
    }
  } catch (err) {
    console.warn(`[Storage] Error deleting file:`, err.message);
  }
}

/**
 * Deletes all files in the 'answer-sheets' bucket belonging to an exam folder.
 */
export async function deleteExamStorageFolder(supabase, examId) {
  if (!examId) return;

  try {
    const { data: files, error: listError } = await supabase.storage
      .from('answer-sheets')
      .list(String(examId), { limit: 1000 });

    if (listError) {
      console.warn(`[Storage] Failed to list files in exam folder '${examId}':`, listError.message);
      return;
    }

    if (files && files.length > 0) {
      const pathsToDelete = files
        .filter(f => f.name && f.name !== '.emptyFolderPlaceholder')
        .map(f => `${examId}/${f.name}`);

      if (pathsToDelete.length > 0) {
        const { error: removeError } = await supabase.storage
          .from('answer-sheets')
          .remove(pathsToDelete);

        if (removeError) {
          console.warn(`[Storage] Failed to remove files for exam '${examId}':`, removeError.message);
        }
      }
    }
  } catch (err) {
    console.warn(`[Storage] Error removing exam folder:`, err.message);
  }
}
