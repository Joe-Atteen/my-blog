import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login | My Blog",
  description: "Login to access the admin dashboard",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
