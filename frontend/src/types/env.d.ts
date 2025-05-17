interface ImportMetaEnv {
	readonly VITE_HOST_SERVER: string;
	readonly VITE_API_PORT: string;
	readonly VITE_API_PROTOKOLL: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
