import LoginForm from "@/components/login-form"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-24 h-24 mx-auto mb-6 bg-[#FF7A00] rounded-lg flex items-center justify-center">
            <div className="w-16 h-16 bg-white rounded-sm relative">
              <div className="absolute top-0 right-0 w-4 h-4 bg-[#FF7A00]"></div>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-[#212121] mb-2">Orange Corners</h1>
          <p className="text-sm text-[#212121] opacity-70">Entrepreneurship for a better world</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
