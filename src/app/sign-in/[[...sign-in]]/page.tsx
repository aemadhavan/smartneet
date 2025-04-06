//src/app/sign-in/[[...sign-in]]/page.tsx

//import Container from '@/components/Container';
import { SignIn } from '@clerk/nextjs'

export default function SigninPage() {
  return (
    <div className="flex min-h-[calc(100vh-200px)] w-full items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <SignIn />
      </div>
    </div>
  )
}