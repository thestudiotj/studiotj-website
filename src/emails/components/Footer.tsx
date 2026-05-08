import { Hr, Link, Section, Text } from '@react-email/components'

export function Footer() {
  return (
    <Section className="mt-12">
      <Hr className="border-neutral-200" />
      <Text className="mt-4 text-xs text-neutral-500">
        StudioTJ · Maastricht, Netherlands · KvK 75602172
      </Text>
      <Text className="text-xs text-neutral-500">
        <Link href="https://studiotj.com" className="text-neutral-700 underline">
          studiotj.com
        </Link>
        {' · '}
        <Link href="mailto:thestudiotj@gmail.com" className="text-neutral-700 underline">
          thestudiotj@gmail.com
        </Link>
      </Text>
    </Section>
  )
}
