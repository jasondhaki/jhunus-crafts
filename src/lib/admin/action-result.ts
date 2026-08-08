// Shared shape every admin Server Action resolves to — rendered as a toast
// by useActionToast, with fieldErrors driving inline form errors the same
// way the rest of the app's useActionState forms already do.
export interface ActionResult {
  success: boolean;
  message: string;
  fieldErrors?: Record<string, string[]>;
}
