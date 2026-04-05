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
  const [uploadStep, setUploadStep] = React.useState(1);

  const { data: metadataTypes = [] } = useQuery({
    queryKey: ["metadata-types"],
    queryFn: () => MetadataService.listTypes(),
  });

  return (
    <CreatePageLayout
      title="Tải lên tài liệu"
      processSteps={
        <ProcessSteps currentStep={uploadStep} variant="gradient" />
      }
    >
      <UploadForm
        metadataTypes={metadataTypes}
        currentStep={uploadStep}
        onStepChange={setUploadStep}
        hideProcessSteps
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["documents"] });
          navigate("/admin/documents/list");
        }}
      />
    </CreatePageLayout>
  );
};

export default DocumentCreatePage;
