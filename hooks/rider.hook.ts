import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { fetchRiderMe, updateRiderMe } from "@/redux/slices/riderSlice";
import {
  IUpdateRiderPayload,
  IRequiredDocument,
  IDocumentUpload,
  riderService,
} from "@/lib/api";

export const useRider = () => {
  const dispatch = useDispatch<AppDispatch>();
  const riderState = useSelector((state: RootState) => state.rider);
  const token = useSelector((state: any) => state.user?.access_token);
  const [loadingRequiredDocs, setLoadingRequiredDocs] = useState(false);
  const [uploadingDocuments, setUploadingDocuments] = useState(false);
  const [deletingDocument, setDeletingDocument] = useState(false);

  // Fetch rider info
  const fetchRider = useCallback(() => {
    return dispatch(fetchRiderMe());
  }, [dispatch]);

  // Update rider info
  const updateRider = useCallback(
    (payload: IUpdateRiderPayload) => {
      return dispatch(updateRiderMe(payload));
    },
    [dispatch],
  );

  // Get required documents for vehicle type
  const getRequiredDocuments = useCallback(
    async (vehicleType: string): Promise<IRequiredDocument[]> => {
      setLoadingRequiredDocs(true);
      try {
        const response = await riderService.getRequiredDocuments(
          vehicleType,
          token,
        );
        return response.data || [];
      } catch (error) {
        console.error("Error fetching required documents:", error);
        throw error;
      } finally {
        setLoadingRequiredDocs(false);
      }
    },
    [token],
  );

  // Upload or update documents
  const uploadDocuments = useCallback(
    async (documents: IDocumentUpload[]) => {
      setUploadingDocuments(true);
      try {
        const response = await riderService.uploadDocuments(documents, token);
        // Refresh rider data to get updated documents
        await dispatch(fetchRiderMe());
        return response.data || [];
      } catch (error) {
        console.error("Error uploading documents:", error);
        throw error;
      } finally {
        setUploadingDocuments(false);
      }
    },
    [dispatch, token],
  );

  // Delete a document
  const deleteDocument = useCallback(
    async (documentId: string) => {
      setDeletingDocument(true);
      try {
        await riderService.deleteDocument(documentId, token);
        // Refresh rider data to get updated documents
        await dispatch(fetchRiderMe());
      } catch (error) {
        console.error("Error deleting document:", error);
        throw error;
      } finally {
        setDeletingDocument(false);
      }
    },
    [dispatch, token],
  );

  // Get document status
  const documentStatus = riderState?.data?.documentStatus || "";

  // Get rejection reason
  const rejectionReason = riderState?.data?.rejectionReason || null;

  // Get documents array
  const documents = riderState?.data?.documents || [];

  // Determine if editing is allowed (only INITIAL or REJECTED)
  const isEditable =
    documentStatus === "INITIAL" || documentStatus === "REJECTED";

  useEffect(() => {
    fetchRider();
  }, [fetchRider, token]);

  return {
    // State
    rider: riderState?.data,
    loading: riderState?.loading,
    error: riderState?.error,
    updating: riderState?.updating,
    updateError: riderState?.updateError,
    documentStatus,
    rejectionReason,
    documents,
    isEditable,
    loadingRequiredDocs,
    uploadingDocuments,
    deletingDocument,

    // Actions
    fetchRider,
    updateRider,
    getRequiredDocuments,
    uploadDocuments,
    deleteDocument,
  };
};
