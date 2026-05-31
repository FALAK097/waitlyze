import prisma from "@/lib/prisma";

export const getDashboardData = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { waitLists: true },
  });

  if (!user) {
    return { success: false, error: "User not found" };
  }

  const waitLists = await prisma.waitList.findMany({
    where: { userId: user.id },
    select: {
      id: true,
      name: true,
      showReferrals: true,
      signUps: { select: { signUpEmailSent: true } },
    },
  });

  return { success: true, data: { user, waitLists } };
};
