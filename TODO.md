# JungleGym TODO — from Updates 4/8 meeting

## Bug Fixes

- [ ] Fix top bar width issue on some pages ON THE MOBILE SITE
- [ ] Fix pricing increment bug — when decreasing from $0.75, should step to $0.70 first (not $0.65 or $0.85). so it should normalize to whatever increment its on first then continue the increment.
- [ ] Fix Instagram/website link save bug on settings/profile page (this might be a me thing on supabase, let me know)

## UI / Design

- [ ] Make thumbnail and title clickable on the video manage page (links to video)
- [ ] Improve spacing and visual design on metrics page, especially on mobile
- [ ] Remove email capture section from homepage (feels spammy)
- [ ] Add muscular body imagery to homepage 
- [ ] Consider black stroke on "Welcome to the Jungle Gym" hero text
- [ ] Auto-adapt treehouse text color based on background image
- [ ] General polish pass across all pages before launch

## Features — Short-term

- [ ] Consolidate checkout to a single-page experience. The tier selector should be above the payment details. this should feel as streamlined as possible.
- [ ] Test views/metrics functionality on free videos (Davis)
- [ ] Add Apple Calendar support for videos and live sessions
- [ ] Add gcal support for live sessions
- [ ] Add Apple sign-in option
- [ ] Add email communication preferences to user settings (these will probably be stand-in settings for now because we don't have a mailing system set up yet so mark it as stand-in)
- [ ] Research and implement share-with-friend feature (email-based access sharing for purchased videos. You can either invite people to the platform or invite someone already on it to have access to the video for a month. You can do this one time?)
- [ ] Develop discovery/browse page improvements
- [ ] Polish treehouse page design and fix performance (was a lil laggy)
- [ ] Develop live sessions infrastructure (this one can be suggestions, or if you can do it just make it work. the live sessions entries need to be clickable.)

## Features — Medium-term

- [ ] Implement auto-tagging using LLM (e.g. one of the new lightweight gemmas on groq) for video titles/transcripts (go ahead and set this up, I can provide an api key when the scaffolding is there)

## Security

- [ ] Security audit before launch

