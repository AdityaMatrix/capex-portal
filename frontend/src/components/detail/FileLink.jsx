import { toast } from "sonner";
import { downloadAuthenticatedFile, isApiUrl, resolveFileUrl } from "@/lib/files";

/**
 * Link to an uploaded file. Files served by our API need the bearer token,
 * which a plain <a href> can't send, so those are downloaded via axios.
 * External URLs stay as normal links.
 */
export function FileLink({ url, filename, className, children, ...rest }) {
  if (!isApiUrl(url)) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className={className} {...rest}>
        {children}
      </a>
    );
  }

  const handleClick = async (e) => {
    e.preventDefault();
    try {
      await downloadAuthenticatedFile(resolveFileUrl(url), filename);
    } catch {
      toast.error("Failed to download file");
    }
  };

  return (
    <a href={resolveFileUrl(url)} onClick={handleClick} className={className} {...rest}>
      {children}
    </a>
  );
}
