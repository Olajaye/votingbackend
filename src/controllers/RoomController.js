
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();


export const createRoom = async (req, res) => {
  const { title, description, options, deadline } = req.body;

  if (!title || !description || !deadline) {
    return res.status(400).json({ message: 'Title, description, and deadline are required' });
  }

  if (!Array.isArray(options) || options.length < 2 || options.length > 5) {
    return res.status(400).json({ message: 'Options must be 2–5' });
  }

  try {
    const room = await prisma.room.create({
      data: {
        title,
        description,
        deadline: new Date(deadline),
        creatorId: req.user.id,
        options: {
          create: options.map((text) => ({ text })),
        },
      },
      include: { options: true },
    });
    res.status(201).json(room);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

export const voteInRoom = async (req, res) => {
  const { optionId, guestsId } = req.body;
  const userId = req.user ? req?.user?.id : null
  const io = req.app.get('io');

  if (!userId && !guestsId) {
    return res.status(400).json({ message: 'Error identiying voter' });
  }

  if(userId && guestsId) {
    return res.status(400).json({ message: 'Cannot vote as both user and guest' });
  }

  try {
    const room = await prisma.room.findUnique({
      where: { uniqueId: req.params.roomId },
      include: { options: true },
    });

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    if (new Date() > new Date(room.deadline)) {
      return res.status(400).json({ message: 'Voting closed' });
    }

    // Check if user/guest has already voted
    let existingVote
    if (guestsId) {
      existingVote = await prisma.vote.findFirst({
        where: {
          roomId: room.id,
          guestsId: guestsId
        },
      });
    } else {
      existingVote = await prisma.vote.findFirst({
        where: {
          roomId: room.id,
          userId: userId
        },
      });
    }

    if (existingVote) {
      return res.status(400).json({ message: 'Already voted' });
    }

    // Validate optionId
    const option = await prisma.option.findUnique({ where: { id: optionId } });
    if (!option || option.roomId !== room.id) {
      return res.status(400).json({ message: 'Invalid option' });
    }

    // Record vote
    await prisma.vote.create({
      data: { roomId: room.id, optionId, userId, guestsId },
    });

    // Update vote count
    await prisma.option.update({
      where: { id: optionId },
      data: { voteCount: { increment: 1 } },
    });

    // Fetch updated options for the room
    const updatedOptions = await prisma.option.findMany({
      where: { roomId: room.id },
    });

    // Emit real-time update
    io.to(room.uniqueId).emit('voteUpdate', updatedOptions);

    res.status(200).json({ message: 'Thanks For Voting' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

export const getRoomDetails = async (req, res) => {
  try {
    const room = await prisma.room.findUnique({
      where: { uniqueId: req.params.roomId },
      include: { options: true },
    });
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    res.json(room);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
}

export const  getAllRooms = async (req, res) => {
  const prisma = req.app.get('prisma');
  try {
    const rooms = await prisma.room.findMany({
      include: { options: true },
    });
    res.json(rooms);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}