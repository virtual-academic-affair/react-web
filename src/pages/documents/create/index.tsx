import { useQuery, useQueryClient } from "@tanstack/react-query";
import React from "react";
import { useNavigate } from "react-router-dom";

import CreatePageLayout from "@/components/layouts/CreatePageLayout";
import { MetadataService } from "@/services/documents";

import { ProcessSteps, UploadForm } from "../components/UploadDrawer";

/**
 * Full-page version of the upload wizard.
 * Uses the shared UploadForm — no logic duplication with UploadDrawer.
 */
const DocumentCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: metadataTypes = [] } = useQuery({
    queryKey: ["metadata-types"],
    queryFn: () => MetadataService.listTypes(),
  });

  // We need currentStep for the page-level stepper; UploadForm owns it internally.
  // Pass a dummy step=1 to the layout header — UploadForm renders its own steps.
  return (
    <CreatePageLayout
      title="Tải lên tài liệu"
      processSteps={<ProcessSteps currentStep={1} />}
    >
      <UploadForm
        metadataTypes={metadataTypes}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["documents"] });
          navigate("/admin/documents/list");
        }}
        actionsClassName="flex justify-end gap-2"
      />
    </CreatePageLayout>
  );
};

export default DocumentCreatePage;
