//src/app/sign-up/[...sign-up]/page.tsx

import { SignUp } from '@clerk/nextjs'

export default function SignupPage() {

   return (
      <div className="flex min-h-[calc(100vh-200px)] w-full items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
        <SignUp />
        </div>
      </div>
    )
}