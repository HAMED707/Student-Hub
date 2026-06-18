"""
Management command: seed community groups with posts, comments, votes, and chat.

Usage:
    python manage.py seed_community_data
    python manage.py seed_community_data --reset   # wipe all community data first
"""

import random
from django.core.management.base import BaseCommand
from django.db import transaction
from django.contrib.auth import get_user_model

from community.models import Group, GroupMembership, Post, PostVote, Comment, GroupChatMessage

User = get_user_model()

UNIVERSITIES = [
    ("Cairo University",      "university", "The official community for Cairo University students."),
    ("Ain Shams University",  "university", "The official community for Ain Shams University students."),
    ("Helwan University",     "university", "The official community for Helwan University students."),
    ("Mansoura University",   "university", "The official community for Mansoura University students."),
    ("Alexandria University", "university", "The official community for Alexandria University students."),
    ("EELU",                  "university", "The official community for EELU (Egyptian E-Learning University) students."),
    ("Galala University",     "university", "The official community for Galala University students."),
    ("Student Housing Egypt", "housing",    "Find roommates, share housing tips, and discover listings across Egypt."),
    ("Study Together",        "study",      "Group study sessions, exam tips, and academic resources for all universities."),
]

POSTS = {
    "Cairo University": [
        {
            "title": "Best cafes near Faculty of Engineering?",
            "content": "Hey everyone! Just transferred to the engineering faculty. Any recommendations for quiet cafes near campus where I can study? Preferably with good wifi and not too expensive.",
            "comments": [
                "Café Greco near gate 3 is perfect — fast wifi and they don't mind if you sit for hours.",
                "Try the library basement first, it's free and super quiet during exams.",
                "There's a new place on Giza St called 'Study Hub', great coffee and AC!",
            ],
            "votes": 12,
        },
        {
            "title": "Looking for roommates — Dokki area",
            "content": "Two male students looking for a third roommate for a 3-bedroom apartment in Dokki. 5 min walk to campus. Rent is 1800 EGP/month per person including utilities. DM me if interested.",
            "comments": [
                "Is it still available? I'm a first-year architecture student.",
                "Which year are you in? Would prefer someone in 2nd or 3rd year.",
                "DM sent! Please check your inbox.",
            ],
            "votes": 8,
        },
        {
            "title": "Final exams schedule released 📅",
            "content": "The faculty of commerce just published the final exam schedule for semester 1. Check the faculty website under 'Student Affairs'. Exams start Dec 20th. Good luck everyone!",
            "comments": [
                "Thanks for the heads up! Panic mode activated 😅",
                "Why is the schedule always released so late??",
                "Does anyone have study notes for Macro Economics?",
                "I have notes, DM me your email.",
            ],
            "votes": 34,
        },
    ],
    "Ain Shams University": [
        {
            "title": "Faculty of Medicine — study group for anatomy",
            "content": "Forming a study group for anatomy final. We meet every Tuesday at the central library, 5th floor. All years welcome. Bring your Gray's Anatomy 😄",
            "comments": [
                "Count me in! Is there room for a 2nd year student?",
                "I'll bring the flashcards.",
                "Can we do it online some days? Some of us commute from far.",
            ],
            "votes": 19,
        },
        {
            "title": "Bus routes from Abbassia to campus?",
            "content": "New student here. What's the best way to get to Ain Shams from Abbassia? The metro doesn't go directly. Any tips on bus numbers or ride-sharing groups?",
            "comments": [
                "Bus 72 from Abbassia square goes directly — takes about 20 min.",
                "There's a student WhatsApp group for ride sharing, ask at the student union office.",
                "I usually take a microbus, cheaper than Uber especially in the morning.",
            ],
            "votes": 7,
        },
    ],
    "Helwan University": [
        {
            "title": "Fine Arts faculty — exhibition this Friday!",
            "content": "The Faculty of Fine Arts is hosting its annual student exhibition this Friday at 4PM. Open to all Helwan University students. Come support your classmates and enjoy amazing artwork!",
            "comments": [
                "I'll be there! My friend has a sculpture piece on display.",
                "Is photography allowed?",
                "Yes! Photography is welcome, just don't use flash near the paintings.",
            ],
            "votes": 22,
        },
        {
            "title": "Cheap apartments near Ain Helwan metro?",
            "content": "Looking for affordable housing options close to campus. Budget is around 1500-2000 EGP/month. Single room preferred. Any recommendations or contacts?",
            "comments": [
                "Check Student Hub app — there are a few listings in that range.",
                "My neighbour is renting a room, DM me for contact.",
                "Housing near the metro gets expensive fast. Try 2 stops away for better prices.",
            ],
            "votes": 15,
        },
    ],
    "Mansoura University": [
        {
            "title": "Dentistry entrance exam tips",
            "content": "For those who just got into dentistry — the practical lab entrance test is in week 3. Bring your own instruments and wear your white coat. Don't stress, the professors are helpful!",
            "comments": [
                "Thank you so much for this! I had no idea about the instruments.",
                "Can we borrow instruments from the faculty store?",
                "Yes, there's a rental counter on the ground floor of the dentistry building.",
            ],
            "votes": 28,
        },
        {
            "title": "Nile Corniche walk — anyone joining this weekend?",
            "content": "Planning a casual weekend walk along the Nile Corniche on Saturday morning, around 8AM. Starting from El Geish square. All students welcome, bring your friends!",
            "comments": [
                "I'm in! Sounds like a great way to de-stress before midterms.",
                "Can we make it 9AM? 8AM is a struggle on weekends 😂",
                "I'll bring some sandwiches for everyone.",
            ],
            "votes": 11,
        },
    ],
    "Alexandria University": [
        {
            "title": "Beach study spots in Alex 🌊",
            "content": "Anyone else discovered you can actually study at Stanley Beach early morning before it gets crowded? The breeze is amazing and I got more done in 2 hours than a whole day at home.",
            "comments": [
                "Stanley is great but Sidi Bishr is less crowded and has better wifi cafes nearby.",
                "This is the content I needed. Moving to Alex next semester, thanks!",
                "Just watch out for seagulls stealing your food 😂",
            ],
            "votes": 45,
        },
        {
            "title": "Faculty of Law — semester registration issue",
            "content": "Anyone else having trouble with the online registration portal? It keeps timing out when I try to add elective courses. The IT helpdesk is overwhelmed. Anyone found a workaround?",
            "comments": [
                "Try using Chrome incognito mode, worked for me.",
                "The portal is overloaded on the first day of registration. Try again after midnight.",
                "I went in person to the registrar office — sorted it in 10 minutes.",
            ],
            "votes": 16,
        },
    ],
    "EELU": [
        {
            "title": "Welcome to EELU online community! 👋",
            "content": "Hey everyone! Since we're all studying remotely, this group is the place to connect, ask questions, share resources, and make friends beyond the screen. Introduce yourself in the comments!",
            "comments": [
                "Hi! I'm Mariam, studying Computer Science from Cairo. So glad this community exists!",
                "Ahmed here, Business Administration from Alexandria. Year 2. Happy to connect!",
                "Nour from Assiut, Engineering faculty. Anyone else from Upper Egypt?",
                "This is exactly what we needed. EELU students unite! 💪",
            ],
            "votes": 67,
        },
        {
            "title": "Tips for staying motivated studying online?",
            "content": "Honestly finding it hard to focus studying from home. Any tips from senior EELU students on how you manage your time and stay on track without the campus environment?",
            "comments": [
                "Set a dedicated study space — even just a corner of your room. No phones during study time.",
                "I use Pomodoro technique: 25 min study, 5 min break. Changed my life.",
                "Find a study partner in this group! Accountability makes a huge difference.",
                "Join virtual study sessions on Zoom. The EELU student union runs them every week.",
            ],
            "votes": 53,
        },
        {
            "title": "EELU exam portal is down — anyone else?",
            "content": "The exam portal seems to be down right now. My midterm is in 2 hours. Is it just me or is this a widespread issue? Has anyone contacted support?",
            "comments": [
                "Same here! Called support — they said it'll be back in 30 mins.",
                "Update: portal is back up as of 10:15 AM.",
                "They should extend the exam time to compensate for the downtime.",
                "This happens every semester honestly 😩",
            ],
            "votes": 41,
        },
    ],
    "Galala University": [
        {
            "title": "New campus orientation — what to expect?",
            "content": "Just got accepted to Galala University! Super excited but also nervous. For those already there — what was orientation like? Any tips for first-years?",
            "comments": [
                "Orientation is well organized! They take you around the whole campus which is huge.",
                "Bring comfortable shoes — you'll be walking a lot. The campus is massive.",
                "The student union booth during orientation is worth visiting. Lots of clubs to join.",
            ],
            "votes": 29,
        },
    ],
    "Student Housing Egypt": [
        {
            "title": "How to avoid housing scams as a student 🚨",
            "content": "With housing season coming up, wanted to share some red flags I've encountered: (1) Landlord asks for 3+ months deposit upfront. (2) No written contract. (3) Pictures look too good to be true. (4) Won't let you visit before signing. Stay safe everyone!",
            "comments": [
                "This is so important. Always use the Student Hub platform for verified listings.",
                "I got scammed my first year. Lost 2 months deposit. Please verify everything!",
                "Another tip: check if utilities are included or extra BEFORE signing.",
                "Always do a WhatsApp video call of the actual apartment, not just photos.",
            ],
            "votes": 89,
        },
        {
            "title": "Is Maadi a good area for students from outside Cairo?",
            "content": "Thinking about moving to Maadi. I've heard mixed things — some say it's expensive, others say it's worth it for the quiet environment. Opinions?",
            "comments": [
                "Maadi is beautiful but yes, pricier than Giza or Nasr City for similar space.",
                "Great for students who value safety and a calm environment.",
                "If you're studying at Cairo University, Giza is more practical and cheaper.",
            ],
            "votes": 18,
        },
    ],
    "Study Together": [
        {
            "title": "Free resources for learning English for university?",
            "content": "Many university courses now require English but not everyone had strong English education. Sharing what worked for me: BBC Learning English (free), Duolingo for basics, and the British Council app. What resources helped you?",
            "comments": [
                "YouTube channel 'English with Lucy' is fantastic for listening skills.",
                "I swear by reading English news articles every day. Al-Monitor has good Egypt coverage.",
                "Watching English Netflix shows with English subtitles improved my vocab fast.",
            ],
            "votes": 72,
        },
        {
            "title": "Anyone up for online study sessions this week?",
            "content": "Finals are coming up and studying alone is tough. I'm setting up a Google Meet study room this Thursday 7-10PM. Topic: anything you need to focus on. Cameras optional. Drop your email to join!",
            "comments": [
                "I'm in! Studying econometrics this week.",
                "Can I join even if I'm studying something completely different?",
                "Of course! It's just a virtual study environment, no need to study the same thing.",
                "Link sent to everyone who commented ✅",
            ],
            "votes": 31,
        },
    ],
}

CHAT_MESSAGES = {
    "Cairo University": [
        ("Any updates on the engineering building renovation?", None),
        ("Yes! They said it'll finish by next semester — new labs apparently.", None),
        ("Finally! Those old computers were from 2008 😂", None),
        ("Does anyone know when the spring semester schedule drops?", None),
        ("Usually mid-January. Check the university portal.", None),
    ],
    "EELU": [
        ("Hey everyone! Anyone from the morning shift?", None),
        ("Morning! Computer science here 👋", None),
        ("Did anyone watch the recorded lecture for chapter 4?", None),
        ("Yes, link is on the portal under resources.", None),
        ("Thanks! The live sessions are at a bad time for me.", None),
        ("I know, they should offer more timeslots honestly.", None),
    ],
    "Ain Shams University": [
        ("Reminder: student union elections are tomorrow!", None),
        ("Who's running this year?", None),
        ("Check the posters near the main gate.", None),
        ("Does the faculty gym need a student card to enter?", None),
        ("Yes, and it's only open 8am-8pm on weekdays.", None),
    ],
    "Student Housing Egypt": [
        ("Anyone know of available rooms near Nasr City for Feb?", None),
        ("Check Student Hub listings — a few posted yesterday.", None),
        ("Is it safe to pay deposit online?", None),
        ("Only use verified platforms. Student Hub has an escrow system.", None),
        ("Smart. What about sharing apartments with strangers?", None),
        ("Check the roommate matching feature — it shows compatibility scores!", None),
    ],
    "Study Together": [
        ("Anyone doing math revision tonight?", None),
        ("Yes! Join the Discord server in the pinned post.", None),
        ("What time?", None),
        ("Starting at 8PM Egypt time.", None),
        ("Perfect, I'll be there 📚", None),
    ],
    "Helwan University": [
        ("Fine arts exhibition was incredible by the way!", None),
        ("Agreed, the sculpture section was 🔥", None),
        ("When's the next one?", None),
        ("Should be in spring semester. Keep an eye on the faculty board.", None),
    ],
}


class Command(BaseCommand):
    help = "Seed community groups with posts, comments, votes, and chat messages."

    def add_arguments(self, parser):
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Delete all posts, comments, votes, and chat messages before seeding.",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        if options["reset"]:
            GroupChatMessage.objects.all().delete()
            PostVote.objects.all().delete()
            Comment.objects.all().delete()
            Post.objects.all().delete()
            GroupMembership.objects.all().delete()
            Group.objects.all().delete()
            self.stdout.write(self.style.WARNING("Wiped all community data."))

        # ── Pick up available student users ──────────────────────────────
        students = list(User.objects.filter(role="student").order_by("id")[:20])
        if not students:
            students = list(User.objects.all().order_by("id")[:5])
        if not students:
            self.stdout.write(self.style.ERROR("No users found. Run user seed commands first."))
            return

        def pick(n=1):
            """Return n random users (with replacement if needed)."""
            pool = students * max(1, (n // len(students)) + 1)
            return random.sample(pool, n)

        # ── Ensure all groups exist ───────────────────────────────────────
        groups = {}
        for name, category, description in UNIVERSITIES:
            group, _ = Group.objects.get_or_create(
                name=name,
                defaults={"description": description, "category": category, "is_private": False},
            )
            groups[name] = group
            self.stdout.write(f"  Group: {name}")

        # ── Add members to each group ─────────────────────────────────────
        for group in groups.values():
            members = pick(min(len(students), random.randint(3, 8)))
            for user in members:
                GroupMembership.objects.get_or_create(
                    user=user,
                    group=group,
                    defaults={"role": "member"},
                )
            group.member_count = group.memberships.count()
            group.save(update_fields=["member_count"])

        # ── Seed posts, comments, votes ───────────────────────────────────
        total_posts = 0
        for group_name, post_list in POSTS.items():
            group = groups.get(group_name)
            if not group:
                continue

            for post_data in post_list:
                author = pick(1)[0]
                post, created = Post.objects.get_or_create(
                    group=group,
                    title=post_data["title"],
                    defaults={"author": author, "content": post_data["content"]},
                )
                if not created:
                    continue
                total_posts += 1

                # Comments
                commenters = pick(len(post_data["comments"]))
                for text, commenter in zip(post_data["comments"], commenters):
                    Comment.objects.get_or_create(
                        post=post,
                        author=commenter,
                        text=text,
                    )

                # Votes — upvote ratio ~80%, remainder downvotes
                vote_users = pick(min(len(students), post_data["votes"]))
                for i, voter in enumerate(vote_users):
                    value = PostVote.UP if i < int(len(vote_users) * 0.8) else PostVote.DOWN
                    PostVote.objects.get_or_create(post=post, user=voter, defaults={"value": value})

        # ── Seed group chat messages ──────────────────────────────────────
        total_msgs = 0
        for group_name, messages in CHAT_MESSAGES.items():
            group = groups.get(group_name)
            if not group:
                continue

            senders = pick(len(messages))
            for (body, _), sender in zip(messages, senders):
                GroupChatMessage.objects.get_or_create(
                    group=group,
                    sender=sender,
                    body=body,
                )
                total_msgs += 1

        self.stdout.write(self.style.SUCCESS(
            f"\nDone — {len(groups)} groups, {total_posts} posts, {total_msgs} chat messages seeded."
        ))
