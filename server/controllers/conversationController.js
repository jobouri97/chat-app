import { findUserById } from "../models/userModel.js";

import { createConversation, findConversationBetweenUsers, getConversationsByUserId, findConversationByIdAndUserId, } from "../models/conversationModel.js";

// Start a private conversation with another user.
export async function startConversation(req, res) {
    try {
        // The JWT authentication middleware creates req.user.
        const currentUserId = Number(req.user.userId);

        // The client sends only the selected user's ID.
        const otherUserId = Number(req.body.otherUserId);

        if (!Number.isInteger(otherUserId) || otherUserId <= 0) {
            return res.status(400).json({
                message: "A valid otherUserId is required.",
            });
        }

        // A user should not start a conversation with himself.
        if (currentUserId === otherUserId) {
            return res.status(400).json({
                message: "You cannot start a conversation with yourself.",
            });
        }

        // Make sure the selected user exists.
        const otherUser = await findUserById(otherUserId);

        if (!otherUser) {
            return res.status(404).json({
                message: "User not found.",
            });
        }

        // Check whether these two users already have a conversation.
        const existingConversation =
            await findConversationBetweenUsers(
                currentUserId,
                otherUserId,
            );

        if (existingConversation) {
            return res.status(200).json({
                message: "Conversation already exists.",
                conversation: existingConversation,
            });
        }

        // Create the conversation and add both participants.
        const conversation = await createConversation(
            currentUserId,
            otherUserId,
        );

        return res.status(201).json({
            message: "Conversation created successfully.",
            conversation,
        });
    } catch (error) {
        console.error("Start conversation error:", error);

        return res.status(500).json({
            message: "Internal server error.",
        });
    }
}

// Get all conversations for the logged-in user.
export async function getMyConversations(req, res) {
    try {
        const currentUserId = Number(req.user.userId);

        const conversations =
            await getConversationsByUserId(currentUserId);

        return res.status(200).json({
            conversations,
        });
    } catch (error) {
        console.error("Get conversations error:", error);

        return res.status(500).json({
            message: "Internal server error.",
        });
    }
}

// Get one conversation by its ID.
export async function getConversationById(req, res) {
    try {
        const currentUserId = Number(req.user.userId);
        const conversationId = Number(req.params.conversationId);

        if (!Number.isInteger(conversationId) || conversationId <= 0) {
            return res.status(400).json({
                message: "Invalid conversation ID.",
            });
        }

        // This query also checks that the current user
        // belongs to the conversation.
        const conversation =
            await findConversationByIdAndUserId(
                conversationId,
                currentUserId,
            );

        if (!conversation) {
            return res.status(404).json({
                message: "Conversation not found.",
            });
        }

        return res.status(200).json({
            conversation,
        });
    } catch (error) {
        console.error("Get conversation error:", error);

        return res.status(500).json({
            message: "Internal server error.",
        });
    }
}
