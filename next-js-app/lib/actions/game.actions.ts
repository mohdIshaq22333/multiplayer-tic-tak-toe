"use server";
import { cookies } from "next/headers";

// import { revalidatePath } from "next/cache";

import { connectToDB } from "../mongoose";

import Game from "../modals/game.modal";

export async function addGame() {
  connectToDB();

  try {
    let user: string = createUser();
    const gameUpdates = new Game({
      gameMap: Array.from({ length: 9 }, () => ""),
      O: "",
      X: user,
      gameStatus: "Game is on",
      winningSet: [],
      activePlayer: "X",
    });
    await gameUpdates.save();

    console.log(gameUpdates);
    return {
      gameMap: gameUpdates?.gameMap,
      gameStatus: gameUpdates?.gameStatus,
      winningSet: gameUpdates?.winningSet,
      activePlayer: gameUpdates?.activePlayer,
      id: gameUpdates?._id,
      userName: user === gameUpdates?.X ? "X" : "O",
    };
  } catch (err) {
    console.log(err);
    return { error: "Something went wrong!" };
  }
}

interface EnterGame {
  id: string;
}
type Status = "Game is on" | "X won the game" | "O won the game" | "Draw";
interface GameData {
  id: string;
  userName: string;
  activePlayer: "X" | "O";
  X: string;
  O: string;
  gameMap: string[];
  gameStatus: Status;
  winningSet: number[];
}
// : Promise<GameData | { error: string }>
export async function enterRoom({ id }: EnterGame) {
  connectToDB();
  try {
    console.log("userrrr", id);
    const gameUpdates = await Game.findById(id);
    if (!gameUpdates) return { error: "Invalid room id" };
    let user: string = createUser();
    console.log("userrrr", user);
    if (
      gameUpdates?.X &&
      gameUpdates?.X !== user &&
      gameUpdates?.O &&
      gameUpdates?.O !== user
    )
      return { error: "Invalid user" };
    if (!gameUpdates?.O && gameUpdates?.X !== user) {
      gameUpdates.O = user;
      await gameUpdates.save();
    }
    return {
      gameMap: gameUpdates?.gameMap,
      winningSet: gameUpdates?.winningSet,
      gameStatus: gameUpdates?.gameStatus,
      activePlayer: gameUpdates?.activePlayer,
      id: gameUpdates?._id,
      userName: user === gameUpdates?.X ? "X" : "O",
      resetRaised: gameUpdates.resetRaised,
    };
    // revalidatePath(path);
  } catch (err) {
    console.log(err);
    return { error: "Something went wrong!" };
  }
}

interface UpdateGame {
  path?: string;
  id: string;
  num: number;
}
export async function updateGame({ id, num }: UpdateGame) {
  connectToDB();
  try {
    const gameUpdates = await Game.findById(id);
    if (!gameUpdates) return { error: "Invalid room id" };
    let user: string = createUser();
    if (user !== gameUpdates?.O && user !== gameUpdates?.X)
      return { error: "Invalid user" };
    if (
      gameUpdates?.gameMap[num] ||
      gameUpdates?.gameStatus !== "Game is on" ||
      gameUpdates?.[gameUpdates?.activePlayer] !== user
    )
      return;
    const winningPatterns = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 4, 8],
      [2, 4, 6],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
    ];

    let tempBlocks = [...gameUpdates?.gameMap];
    tempBlocks[num] = gameUpdates?.activePlayer;
    gameUpdates.gameMap = tempBlocks;
    let tie = true;
    for (let i = 0; i < winningPatterns.length; i++) {
      if (
        tempBlocks[winningPatterns[i][0]] === gameUpdates?.activePlayer &&
        tempBlocks[winningPatterns[i][1]] === gameUpdates?.activePlayer &&
        tempBlocks[winningPatterns[i][2]] === gameUpdates?.activePlayer
      ) {
        gameUpdates.gameStatus = `${gameUpdates?.activePlayer} won the game`;
        gameUpdates.winningSet = winningPatterns[i];
      }
      if (
        (!tie && !tempBlocks[winningPatterns[i][0]]) ||
        !tempBlocks[winningPatterns[i][1]] ||
        !tempBlocks[winningPatterns[i][2]]
      ) {
        tie = false;
      }
    }
    if (!gameUpdates.winningSet[0]) {
      if (tie) {
        gameUpdates.gameStatus = "Draw";
      } else {
        gameUpdates.activePlayer =
          gameUpdates?.activePlayer === "O" ? "X" : "O";
      }
    }
    await gameUpdates.save();
    return {
      gameMap: gameUpdates?.gameMap,
      winningSet: gameUpdates?.winningSet,
      gameStatus: gameUpdates?.gameStatus,
      activePlayer: gameUpdates?.activePlayer,
      id: gameUpdates?._id,
      userName: user === gameUpdates?.X ? "X" : "O",
      resetRaised: gameUpdates.resetRaised,
    };
    // revalidatePath(path);
  } catch (err) {
    console.log(err);
    return { error: "Something went wrong!" };
  }
}
interface ResetGame {
  id: string;
}
export async function resetGame({ id }: ResetGame) {
  connectToDB();
  try {
    const foundRoom = await Game.findById(id);
    if (!foundRoom) return { error: "Invalid Room" };
    const cookieStore = cookies();
    let user: string | undefined = cookieStore.get("user")?.value;
    if (!user || (user !== foundRoom?.O && user !== foundRoom?.X))
      return { error: "Invalid user" };
    console.log("foundRoom?.O", foundRoom?.O);
    console.log("foundRoom?.O", foundRoom?.resetRaised ?? true);
    const userName = user === foundRoom?.X ? "X" : "O";
    console.log("userName", userName);
    console.log("foundRoom?.resetRaised", foundRoom?.resetRaised);
    console.log("foundRoom?.resetRaised", foundRoom);
    if (
      (foundRoom?.resetRaised && foundRoom?.resetRaised !== userName) ||
      !foundRoom?.O
    ) {
      foundRoom.gameMap = Array.from({ length: 9 }, () => "");
      foundRoom.gameStatus = "Game is on";
      foundRoom.winningSet = [];
      foundRoom.activePlayer = "X";
      foundRoom.resetRaised = "";
    } else {
      foundRoom.resetRaised = userName;
    }
    await foundRoom.save();
    return {
      gameMap: foundRoom?.gameMap,
      gameStatus: foundRoom?.gameStatus,
      winningSet: foundRoom?.winningSet,
      activePlayer: foundRoom?.activePlayer,
      id: foundRoom?._id,
      userName: userName,
      resetRaised: foundRoom.resetRaised,
    };
  } catch (err) {
    console.log(err);
    return { error: "Something went wrong" };
  }
}

const createUser = (): string => {
  const cookieStore = cookies();
  let user: { value: string } | undefined = cookieStore.get("user");
  if (!user) {
    let uuid = crypto.randomUUID();
    cookieStore.set("user", uuid);
    user = { value: uuid };
  }
  return user.value;
};

// export async function fetchPosts(pageNumber = 1, pageSize = 20) {
//   connectToDB();

//   // Calculate the number of posts to skip based on the page number and page size.
//   const skipAmount = (pageNumber - 1) * pageSize;

//   // Create a query to fetch the posts that have no parent (top-level threads) (a thread that is not a comment/reply).
//   const postsQuery = Thread.find({ parentId: { $in: [null, undefined] } })
//     .sort({ createdAt: "desc" })
//     .skip(skipAmount)
//     .limit(pageSize)
//     .populate({
//       path: "author",
//       model: User,
//     })
//     .populate({
//       path: "community",
//       model: Community,
//     })
//     .populate({
//       path: "children", // Populate the children field
//       populate: {
//         path: "author", // Populate the author field within children
//         model: User,
//         select: "_id name parentId image", // Select only _id and username fields of the author
//       },
//     });

//   // Count the total number of top-level posts (threads) i.e., threads that are not comments.
//   const totalPostsCount = await Thread.countDocuments({
//     parentId: { $in: [null, undefined] },
//   }); // Get the total count of posts

//   const posts = await postsQuery.exec();

//   const isNext = totalPostsCount > skipAmount + posts.length;

//   return { posts, isNext };
// }

// interface Params {
//   text: string,
//   author: string,
//   communityId: string | null,
//   path: string,
// }

// export async function createThread({ text, author, communityId, path }: Params
// ) {
//   try {
//     connectToDB();

//     const communityIdObject = await Community.findOne(
//       { id: communityId },
//       { _id: 1 }
//     );

//     const createdThread = await Thread.create({
//       text,
//       author,
//       community: communityIdObject, // Assign communityId if provided, or leave it null for personal account
//     });

//     // Update User model
//     await User.findByIdAndUpdate(author, {
//       $push: { threads: createdThread._id },
//     });

//     if (communityIdObject) {
//       // Update Community model
//       await Community.findByIdAndUpdate(communityIdObject, {
//         $push: { threads: createdThread._id },
//       });
//     }

//     revalidatePath(path);
//   } catch (error: any) {
//     throw new Error(`Failed to create thread: ${error.message}`);
//   }
// }

// async function fetchAllChildThreads(threadId: string): Promise<any[]> {
//   const childThreads = await Thread.find({ parentId: threadId });

//   const descendantThreads = [];
//   for (const childThread of childThreads) {
//     const descendants = await fetchAllChildThreads(childThread._id);
//     descendantThreads.push(childThread, ...descendants);
//   }

//   return descendantThreads;
// }

// export async function deleteThread(id: string, path: string): Promise<void> {
//   try {
//     connectToDB();

//     // Find the thread to be deleted (the main thread)
//     const mainThread = await Thread.findById(id).populate("author community");

//     if (!mainThread) {
//       throw new Error("Thread not found");
//     }

//     // Fetch all child threads and their descendants recursively
//     const descendantThreads = await fetchAllChildThreads(id);

//     // Get all descendant thread IDs including the main thread ID and child thread IDs
//     const descendantThreadIds = [
//       id,
//       ...descendantThreads.map((thread) => thread._id),
//     ];

//     // Extract the authorIds and communityIds to update User and Community models respectively
//     const uniqueAuthorIds = new Set(
//       [
//         ...descendantThreads.map((thread) => thread.author?._id?.toString()), // Use optional chaining to handle possible undefined values
//         mainThread.author?._id?.toString(),
//       ].filter((id) => id !== undefined)
//     );

//     const uniqueCommunityIds = new Set(
//       [
//         ...descendantThreads.map((thread) => thread.community?._id?.toString()), // Use optional chaining to handle possible undefined values
//         mainThread.community?._id?.toString(),
//       ].filter((id) => id !== undefined)
//     );

//     // Recursively delete child threads and their descendants
//     await Thread.deleteMany({ _id: { $in: descendantThreadIds } });

//     // Update User model
//     await User.updateMany(
//       { _id: { $in: Array.from(uniqueAuthorIds) } },
//       { $pull: { threads: { $in: descendantThreadIds } } }
//     );

//     // Update Community model
//     await Community.updateMany(
//       { _id: { $in: Array.from(uniqueCommunityIds) } },
//       { $pull: { threads: { $in: descendantThreadIds } } }
//     );

//     revalidatePath(path);
//   } catch (error: any) {
//     throw new Error(`Failed to delete thread: ${error.message}`);
//   }
// }

// export async function fetchThreadById(threadId: string) {
//   connectToDB();

//   try {
//     const thread = await Thread.findById(threadId)
//       .populate({
//         path: "author",
//         model: User,
//         select: "_id id name image",
//       }) // Populate the author field with _id and username
//       .populate({
//         path: "community",
//         model: Community,
//         select: "_id id name image",
//       }) // Populate the community field with _id and name
//       .populate({
//         path: "children", // Populate the children field
//         populate: [
//           {
//             path: "author", // Populate the author field within children
//             model: User,
//             select: "_id id name parentId image", // Select only _id and username fields of the author
//           },
//           {
//             path: "children", // Populate the children field within children
//             model: Thread, // The model of the nested children (assuming it's the same "Thread" model)
//             populate: {
//               path: "author", // Populate the author field within nested children
//               model: User,
//               select: "_id id name parentId image", // Select only _id and username fields of the author
//             },
//           },
//         ],
//       })
//       .exec();

//     return thread;
//   } catch (err) {
//     console.error("Error while fetching thread:", err);
//     throw new Error("Unable to fetch thread");
//   }
// }

// export async function addCommentToThread(
//   threadId: string,
//   commentText: string,
//   userId: string,
//   path: string
// ) {
//   connectToDB();

//   try {
//     // Find the original thread by its ID
//     const originalThread = await Thread.findById(threadId);

//     if (!originalThread) {
//       throw new Error("Thread not found");
//     }

//     // Create the new comment thread
//     const commentThread = new Thread({
//       text: commentText,
//       author: userId,
//       parentId: threadId, // Set the parentId to the original thread's ID
//     });

//     // Save the comment thread to the database
//     const savedCommentThread = await commentThread.save();

//     // Add the comment thread's ID to the original thread's children array
//     originalThread.children.push(savedCommentThread._id);

//     // Save the updated original thread to the database
//     await originalThread.save();

//     revalidatePath(path);
//   } catch (err) {
//     console.error("Error while adding comment:", err);
//     throw new Error("Unable to add comment");
//   }
// }
