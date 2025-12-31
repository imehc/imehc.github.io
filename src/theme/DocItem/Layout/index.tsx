import GiscusComments from "@site/src/components/GiscusComments";
import type { Props } from "@theme/DocItem/Layout";
import OriginalDocItemLayout from "@theme-original/DocItem/Layout";
import type { ReactNode } from "react";
import { Toaster } from 'sonner';

export default function DocItemLayout(props: Props): ReactNode {
	return (
		<>
			<Toaster position="top-center" richColors />
			<OriginalDocItemLayout {...props} />
			{process.env.NODE_ENV === "production" && <GiscusComments />}
		</>
	);
}
