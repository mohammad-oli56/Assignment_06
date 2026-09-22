// import { prisma } from "../src/lib/prisma";




// async function main() {
//   const users = await prisma.user.findMany({
//     where: {
//       accountNumber: null,
//     },
//   });

//   for (const user of users) {
//     await prisma.user.update({
//       where: {
//         id: user.id,
//       },
//       data: {
//         accountNumber: `ACC-${user.id}`,
//       },
//     });
//   }
// }

// main()
//   .catch(console.error)
//   .finally(() => prisma.$disconnect());