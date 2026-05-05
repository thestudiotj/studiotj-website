import { Body, Container, Head, Heading, Html, Preview, Section, Tailwind } from '@react-email/components'
import { ReactNode } from 'react'
import { Footer } from './Footer'

interface LayoutProps {
  preview: string
  heading: string
  children: ReactNode
}

export function Layout({ preview, heading, children }: LayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Tailwind>
        <Body className="bg-white font-sans text-neutral-900">
          <Container className="mx-auto max-w-xl px-6 py-12">
            <Section>
              <Heading className="text-2xl font-semibold tracking-tight">
                {heading}
              </Heading>
            </Section>
            {children}
            <Footer />
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}
