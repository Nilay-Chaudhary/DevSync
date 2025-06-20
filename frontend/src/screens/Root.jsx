import { useNavigate } from "react-router-dom";

const Root = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-100 via-white to-indigo-200 px-6 text-center">
      <h1 className="text-5xl font-bold text-indigo-700 mb-4">Welcome to DevSync</h1>
      <p className="text-lg text-gray-700 max-w-xl mb-8">
        DevSync is your collaborative space for developer group chats, powered by AI.
        Mention <span className="font-mono text-indigo-600">@ai</span> in your conversation to
        message the AI, from debugging to code generation. Run AI-suggested code
        right inside your chat.
      </p>
      <div className="flex gap-4 mb-8">
        <button
          onClick={() => navigate("/register")}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-6 rounded-xl shadow"
        >
          Sign Up
        </button>
        <button
          onClick={() => navigate("/login")}
          className="border border-indigo-600 hover:bg-indigo-100 text-indigo-700 font-semibold py-2 px-6 rounded-xl shadow"
        >
          Sign In
        </button>
      </div>

      <p className="text-sm text-gray-500">
        Build, chat, code - together. With <span className="font-semibold">@ai</span> in the loop.
      </p>
    </div>
  );
};

export default Root;
