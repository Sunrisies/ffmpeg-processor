import { open } from '@tauri-apps/plugin-dialog'

export const handleSelectFile = async (accept: string[], onChange: (path: string) => void) => {
    console.log(accept, 'accept')
    try {
        const selected = await open({
            filters: accept ? [{
                name: "Video",
                extensions: accept
            }] : undefined,
            multiple: false,
            directory: false
        })

        if (selected) {
            onChange(selected)
        }
    } catch (error) {
        console.error("选择文件失败:", error)
    }
}