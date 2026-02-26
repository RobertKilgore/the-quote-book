// src/components/ConfirmDialog.js
import { confirmAlert } from "react-confirm-alert";

// Standard app confirmation dialog
export function showConfirm({
  title = "Confirm",
  message = "",
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmClassName = "delete-button",
  cancelClassName = "cancel-button",
  onConfirm = async () => {},
  onCancel = () => {},
  closeOnEscape = true,
  closeOnClickOutside = true,
}) {
  confirmAlert({
    title,
    message,
    buttons: [
      {
        label: cancelText,
        onClick: onCancel,
        className: cancelClassName,
      },
      {
        label: confirmText,
        onClick: onConfirm,
        className: confirmClassName,
      },
    ],
    closeOnEscape,
    closeOnClickOutside,
  });
}