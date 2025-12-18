import { createClient } from "@/lib/supabase/server";
import { WorkflowEngine } from "../workflow-engine";

interface FormSubmittedTriggerConfig {
  form_id: string;
}

interface FormSubmission {
  id: string;
  form_id: string;
  contact_id: string;
  workspace_id: string;
  data: Record<string, any>;
  [key: string]: any;
}

/**
 * Handle form submitted trigger
 * Called when a form is submitted
 */
export async function handleFormSubmitted(submission: FormSubmission): Promise<void> {
  try {
    const supabase = await createClient();

    // Find active workflows with form_submitted trigger for this form
    const { data: workflows, error } = await (supabase as any)
      .from("crm_workflows")
      .select("*")
      .eq("workspace_id", submission.workspace_id)
      .eq("status", "active")
      .eq("trigger->type", "form_submitted");

    if (error) {
      console.error("Error fetching workflows:", error);
      return;
    }

    if (!workflows || workflows.length === 0) {
      return;
    }

    // Check each workflow
    for (const workflow of workflows) {
      const triggerConfig = workflow.trigger?.config as FormSubmittedTriggerConfig;

      // Check if form matches
      if (triggerConfig?.form_id !== submission.form_id) {
        continue;
      }

      // Enroll contact in workflow
      await WorkflowEngine.enrollContact(workflow.id, submission.contact_id, {
        trigger: "form_submitted",
        form_id: submission.form_id,
        submission_id: submission.id,
        form_data: submission.data,
      });

      console.log(
        `Enrolled contact ${submission.contact_id} in workflow ${workflow.id} (form_submitted)`
      );
    }
  } catch (error) {
    console.error("Error handling form_submitted trigger:", error);
  }
}

/**
 * Create trigger index file for easy imports
 */
export { handleFormSubmitted as formSubmissionTrigger };
