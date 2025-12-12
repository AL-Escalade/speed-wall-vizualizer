/**
 * Loading and error state components for print preview
 */

interface StateContainerProps {
  isMobile: boolean;
  children: React.ReactNode;
}

function StateContainer({ isMobile, children }: StateContainerProps) {
  return (
    <div className={`${isMobile ? 'py-8' : 'flex-1'} flex items-center justify-center`}>
      {children}
    </div>
  );
}

export interface PrintPreviewLoadingProps {
  isMobile: boolean;
}

export function PrintPreviewLoading({ isMobile }: PrintPreviewLoadingProps) {
  return (
    <StateContainer isMobile={isMobile}>
      <span className="loading loading-spinner loading-lg"></span>
    </StateContainer>
  );
}

export interface PrintPreviewErrorProps {
  isMobile: boolean;
  error: string;
}

export function PrintPreviewError({ isMobile, error }: PrintPreviewErrorProps) {
  return (
    <StateContainer isMobile={isMobile}>
      <div className="alert alert-error max-w-md">
        <span>{error}</span>
      </div>
    </StateContainer>
  );
}

export interface PrintPreviewEmptyProps {
  isMobile: boolean;
  message: string;
}

export function PrintPreviewEmpty({ isMobile, message }: PrintPreviewEmptyProps) {
  return (
    <StateContainer isMobile={isMobile}>
      <div className="text-base-content/40 text-lg text-center">
        <p>{message}</p>
      </div>
    </StateContainer>
  );
}
