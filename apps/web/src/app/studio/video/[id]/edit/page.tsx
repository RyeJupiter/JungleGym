import { redirect } from 'next/navigation'

type Props = { params: Promise<{ id: string }> }

export default async function VideoEditRedirect({ params }: Props) {
  const { id } = await params
  redirect(`/studio/video/${id}/manage`)
}
