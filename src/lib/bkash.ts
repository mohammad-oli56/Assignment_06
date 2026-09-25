import config from "../config"
import { Redisclient } from "./redis"

export const getBkashIdToken = async () => {
    const idTokenKey = "Bkash:IdToken"
    const refreshTokenKey = "Bkash:RefreshToken"

    // Check ID token
    let bkashIdToken = await Redisclient.get(idTokenKey)

    const idTokenTTL = await Redisclient.ttl(idTokenKey)

    // If ID token is still valid
    if (bkashIdToken && idTokenTTL > 600) {
        return bkashIdToken
    }

    // Check refresh token
    const bkashRefreshToken = await Redisclient.get(refreshTokenKey)
    const refreshTokenTTL = await Redisclient.ttl(refreshTokenKey)

    // Try refresh token
    if (!bkashIdToken && bkashRefreshToken && refreshTokenTTL > 600) {
        const refresh = await fetch(
            `${config.BKASH_BASE_URL}/tokenized/checkout/token/refresh`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    username: config.BKASH_USERNAME,
                    password: config.BKASH_PASSWORD,
                },
                body: JSON.stringify({
                    app_key: config.BKASH_APP_KEY,
                    app_secret: config.BKASH_APP_SECRET,
                    refresh_token: bkashRefreshToken,
                }),
            }
        )

        if (!refresh.ok) {
            throw new Error("bKash refresh token failed")
        }

        const refreshResult = await refresh.json()

        if (!refreshResult.id_token) {
            throw new Error("bKash ID token not received")
        }

        if (!refreshResult.id_token) {
            throw new Error("bKash ID token not received")
        }


        bkashIdToken = refreshResult.id_token as string


        await Redisclient.set(idTokenKey, bkashIdToken, {
            expiration: {
                type: "EX",
                value: 60 * 60,
            },
        })

        return bkashIdToken
    }

    // Generate new token
    const response = await fetch(
        `${config.BKASH_BASE_URL}/tokenized/checkout/token/grant`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                username: config.BKASH_USERNAME,
                password: config.BKASH_PASSWORD,
            },
            body: JSON.stringify({
                app_key: config.BKASH_APP_KEY,
                app_secret: config.BKASH_APP_SECRET,
            }),
        }
    )

    if (!response.ok) {
        throw new Error("bKash access token failed")
    }

    const result = await response.json()

    if (!result.id_token || !result.refresh_token) {
        throw new Error("bKash token response is invalid")
    }

    await Redisclient.set(idTokenKey, result.id_token, {
        expiration: {
            type: "EX",
            value: 60 * 60,
        },
    })

    await Redisclient.set(refreshTokenKey, result.refresh_token, {
        expiration: {
            type: "EX",
            value: 60 * 60 * 24 * 28,
        },
    })

    return result.id_token
}