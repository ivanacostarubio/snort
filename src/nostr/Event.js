import * as secp from '@noble/secp256k1';
import EventKind from "./EventKind";
import Tag from './Tag';
import Thread from './Thread';

export default class Event {
    constructor() {
        /**
         * The original event
         */
        this.Original = null;

        /**
         * Id of the event
         * @type {string}
         */
        this.Id = null;

        /**
         * Pub key of the creator
         * @type {string}
         */
        this.PubKey = null;

        /**
         * Timestamp when the event was created
         * @type {number}
         */
        this.CreatedAt = null;

        /**
         * The type of event
         * @type {EventKind}
         */
        this.Kind = null;

        /**
         * A list of metadata tags
         * @type {Array<Tag>}
         */
        this.Tags = [];

        /**
         * Content of the event
         * @type {string}
         */
        this.Content = null;

        /**
         * Signature of this event from the creator
         * @type {string}
         */
        this.Signature = null;

        /**
         * Thread information for this event
         * @type {Thread}
         */
        this.Thread = null;
    }

    /**
     * Get the pub key of the creator of this event NIP-26
     */
    get RootPubKey() {
        let delegation = this.Tags.find(a => a.Key === "delegation");
        if (delegation) {
            return delegation.PubKey;
        }
        return this.PubKey;
    }

    /**
     * Sign this message with a private key
     * @param {string} key Key to sign message with
     */
    async Sign(key) {
        this.Id = await this.CreateId();

        let sig = await secp.schnorr.sign(this.Id, key);
        this.Signature = secp.utils.bytesToHex(sig);
        if (!await this.Verify()) {
            throw "Signing failed";
        }
    }

    /**
     * Check the signature of this message
     * @returns True if valid signature
     */
    async Verify() {
        let id = await this.CreateId();
        let result = await secp.schnorr.verify(this.Signature, id, this.PubKey);
        return result;
    }

    async CreateId() {
        let payload = [
            0,
            this.PubKey,
            this.CreatedAt,
            this.Kind,
            this.Tags.map(a => a.ToObject()).filter(a => a !== null),
            this.Content
        ];

        let payloadData = new TextEncoder().encode(JSON.stringify(payload));
        let data = await secp.utils.sha256(payloadData);
        let hash = secp.utils.bytesToHex(data);
        if (this.Id !== null && hash !== this.Id) {
            console.debug(payload);
            throw "ID doesnt match!";
        }
        return hash;
    }

    /**
     * Does this event have content
     * @returns {boolean}
     */
    IsContent() {
        const ContentKinds = [
            EventKind.TextNote
        ];
        return ContentKinds.includes(this.Kind);
    }

    static FromObject(obj) {
        if (typeof obj !== "object") {
            return null;
        }

        let ret = new Event();
        ret.Original = obj;
        ret.Id = obj.id;
        ret.PubKey = obj.pubkey;
        ret.CreatedAt = obj.created_at;
        ret.Kind = obj.kind;
        ret.Tags = obj.tags.map((e, i) => new Tag(e, i)).filter(a => !a.Invalid);
        ret.Content = obj.content;
        ret.Signature = obj.sig;
        ret.Thread = Thread.ExtractThread(ret);
        return ret;
    }

    ToObject() {
        return {
            id: this.Id,
            pubkey: this.PubKey,
            created_at: this.CreatedAt,
            kind: this.Kind,
            tags: this.Tags.sort((a, b) => a.Index - b.Index).map(a => a.ToObject()).filter(a => a !== null),
            content: this.Content,
            sig: this.Signature
        };
    }

    /**
     * Create a new event for a specific pubkey
     * @param {String} pubKey 
     */
    static ForPubKey(pubKey) {
        let ev = new Event();
        ev.CreatedAt = parseInt(new Date().getTime() / 1000);
        ev.PubKey = pubKey;
        return ev;
    }
}