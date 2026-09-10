import { SignUp } from "@clerk/nextjs";

export default function Register() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', padding: '20px' }}>
      <SignUp routing="hash" />
    </div>
  );
}
