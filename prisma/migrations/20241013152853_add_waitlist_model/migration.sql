-- CreateTable
CREATE TABLE "wait_lists" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "url" TEXT,
    "submitButtonColor" TEXT,
    "backgroundColor" TEXT,
    "fontColor" TEXT,
    "buttonFontColor" TEXT,
    "borderColor" TEXT,
    "title" TEXT,
    "signUpButtonText" TEXT,
    "twitterLink" TEXT,
    "facebookLink" TEXT,
    "instagramLink" TEXT,
    "linkedInLink" TEXT,
    "showSocialLinks" BOOLEAN NOT NULL DEFAULT true,
    "userId" TEXT NOT NULL,

    CONSTRAINT "wait_lists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SignUp" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "device" TEXT,
    "region" TEXT,
    "ipAddress" TEXT,
    "lattitude" TEXT,
    "longitude" TEXT,
    "waitListId" TEXT NOT NULL,

    CONSTRAINT "SignUp_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "wait_lists" ADD CONSTRAINT "wait_lists_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SignUp" ADD CONSTRAINT "SignUp_waitListId_fkey" FOREIGN KEY ("waitListId") REFERENCES "wait_lists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
