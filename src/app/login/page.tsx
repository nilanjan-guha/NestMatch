import { SignIn } from "@clerk/nextjs";

export default function Login() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', padding: '20px' }}>
      <SignIn routing="hash" />
    </div>
  );
}
