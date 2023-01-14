import { Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { TwitterTweetEmbed } from "react-twitter-embed";

import { UrlRegex, FileExtensionRegex, MentionRegex, InvoiceRegex, YoutubeUrlRegex, TweetUrlRegex, HashtagRegex } from "../Const";
import { eventLink, hexToBech32, profileLink } from "../Util";
import Invoice from "./Invoice";
import LazyImage from "./LazyImage";
import Hashtag from "./Hashtag";

import './Text.css'

function transformHttpLink(a) {
    try {
        const url = new URL(a);
        const youtubeId = YoutubeUrlRegex.test(a) && RegExp.$1;
        const tweetId = TweetUrlRegex.test(a) && RegExp.$2;
        const extension = FileExtensionRegex.test(url.pathname.toLowerCase()) && RegExp.$1;
        if (extension) {
            switch (extension) {
                case "gif":
                case "jpg":
                case "jpeg":
                case "png":
                case "bmp":
                case "webp": {
                    return <LazyImage key={url} src={url} />;
                }
                case "mp4":
                case "mov":
                case "mkv":
                case "avi":
                case "m4v": {
                    return <video key={url} src={url} controls />
                }
                default:
                    return <a key={url} href={url} onClick={(e) => e.stopPropagation()}>{url.toString()}</a>
            }
        } else if (tweetId) {
          return (
            <div className="tweet" key={tweetId}>
              <TwitterTweetEmbed tweetId={tweetId} />
            </div>
          )
        } else if (youtubeId) {
            return (
                <>
                    <br />
                    <iframe
                        className="w-max"
                        src={`https://www.youtube.com/embed/${youtubeId}`}
                        title="YouTube video player"
                        key={youtubeId}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen=""
                    />
                    <br />
                </>
            )
        } else {
            return <a href={a} onClick={(e) => e.stopPropagation()}>{a}</a>
        }
    } catch (error) {
    }
    return <a href={a} onClick={(e) => e.stopPropagation()}>{a}</a>
}

function extractLinks(fragments) {
    return fragments.map(f => {
        if (typeof f === "string") {
            return f.split(UrlRegex).map(a => {
                if (a.startsWith("http")) {
                    return transformHttpLink(a)
                }
                return a;
            });
        }
        return f;
    }).flat();
}

export function extractMentions(fragments, tags, users) {
    return fragments.map(f => {
        if (typeof f === "string") {
            return f.split(MentionRegex).map((match) => {
                let matchTag = match.match(/#\[(\d+)\]/);
                if (matchTag && matchTag.length === 2) {
                    let idx = parseInt(matchTag[1]);
                    let ref = tags?.find(a => a.Index === idx);
                    if (ref) {
                        switch (ref.Key) {
                            case "p": {
                                let pUser = users[ref.PubKey]?.name ?? hexToBech32("npub", ref.PubKey).substring(0, 12);
                                return <Link key={ref.PubKey} to={profileLink(ref.PubKey)} onClick={(e) => e.stopPropagation()}>@{pUser}</Link>;
                            }
                            case "e": {
                                let eText = hexToBech32("note", ref.Event).substring(0, 12);
                                return <Link key={ref.Event} to={eventLink(ref.Event)} onClick={(e) => e.stopPropagation()}>#{eText}</Link>;
                            }
                        }
                    }
                    return <b style={{ color: "var(--error)" }}>{matchTag[0]}?</b>;
                } else {
                    return match;
                }
            });
        }
        return f;
    }).flat();
}

function extractInvoices(fragments) {
    return fragments.map(f => {
        if (typeof f === "string") {
            return f.split(InvoiceRegex).map(i => {
                if (i.toLowerCase().startsWith("lnbc")) {
                    return <Invoice key={i} invoice={i} />
                } else {
                    return i;
                }
            });
        }
        return f;
    }).flat();
}

function extractHashtags(fragments) {
    return fragments.map(f => {
        if (typeof f === "string") {
            return f.split(HashtagRegex).map(i => {
                if (i.toLowerCase().startsWith("#")) {
                    return <Hashtag>{i}</Hashtag>
                } else {
                    return i;
                }
            });
        }
        return f;
    }).flat();
}

function transformLi({ body, tags, users }) {
  let fragments = transformText({ body, tags, users })
  return <li>{fragments}</li>
}

function transformParagraph({ body, tags, users }) {
  const fragments = transformText({ body, tags, users })
  if (fragments.every(f => typeof f === 'string')) {
    return <p>{fragments}</p>
  }
  return <>{fragments}</>
}

function transformText({ body, tags, users }) {
    let fragments = extractMentions(body, tags, users);
    fragments = extractLinks(fragments);
    fragments = extractInvoices(fragments);
    fragments = extractHashtags(fragments);
    return fragments;
}

export default function Text({ content, tags, users }) {
    const components = {
      p: (props) => transformParagraph({ body: props.children, tags, users }),
      a: (props) => transformHttpLink(props.href),
      li: (props) => transformLi({ body: props.children, tags, users }),
    }
    return <ReactMarkdown className="text" components={components}>{content}</ReactMarkdown>
}
