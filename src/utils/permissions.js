/**
 * Permission utilities for data sharing
 */

/**
 * Check if user can view a patient's data
 * @param {Object} patient - Patient object
 * @param {string} userId - Current user ID
 * @returns {boolean}
 */
export const canView = (patient, userId) => {
    if (!patient || !userId) return false;

    // Owner can always view
    if (patient.userId === userId) return true;

    // Check if shared with user
    if (patient.sharedWith && Array.isArray(patient.sharedWith)) {
        return patient.sharedWith.some(share => share.userId === userId);
    }

    return false;
};

/**
 * Check if user can edit a patient's data
 * @param {Object} patient - Patient object
 * @param {string} userId - Current user ID
 * @returns {boolean}
 */
export const canEdit = (patient, userId) => {
    if (!patient || !userId) return false;

    // Owner can always edit
    if (patient.userId === userId) return true;

    // Check if shared with edit permission
    if (patient.sharedWith && Array.isArray(patient.sharedWith)) {
        const share = patient.sharedWith.find(s => s.userId === userId);
        return share && share.permission === 'edit';
    }

    return false;
};

/**
 * Check if user can delete a patient
 * @param {Object} patient - Patient object
 * @param {string} userId - Current user ID
 * @returns {boolean}
 */
export const canDelete = (patient, userId) => {
    if (!patient || !userId) return false;

    // Only owner can delete
    return patient.userId === userId;
};

/**
 * Check if user can share a patient
 * @param {Object} patient - Patient object
 * @param {string} userId - Current user ID
 * @returns {boolean}
 */
export const canShare = (patient, userId) => {
    if (!patient || !userId) return false;

    // Only owner can share
    return patient.userId === userId;
};

/**
 * Check if user is the owner of a patient
 * @param {Object} patient - Patient object
 * @param {string} userId - Current user ID
 * @returns {boolean}
 */
export const isOwner = (patient, userId) => {
    if (!patient || !userId) return false;
    return patient.userId === userId;
};

/**
 * Get user's permission level for a patient
 * @param {Object} patient - Patient object
 * @param {string} userId - Current user ID
 * @returns {string} - 'owner', 'edit', 'view', or 'none'
 */
export const getPermissionLevel = (patient, userId) => {
    if (!patient || !userId) return 'none';

    if (patient.userId === userId) return 'owner';

    if (patient.sharedWith && Array.isArray(patient.sharedWith)) {
        const share = patient.sharedWith.find(s => s.userId === userId);
        if (share) return share.permission;
    }

    return 'none';
};

/**
 * Get list of users who have access to a patient
 * @param {Object} patient - Patient object
 * @returns {Array} - Array of share objects
 */
export const getSharedUsers = (patient) => {
    if (!patient || !patient.sharedWith) return [];
    return patient.sharedWith;
};
